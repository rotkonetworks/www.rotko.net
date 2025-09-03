import { createSignal, createEffect, For, Show, Component, onCleanup } from 'solid-js'

interface WirssiChatProps {
 server?: string
 channel?: string
 nick?: string
 position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

interface ChatBox {
 id: string
 type: 'channel' | 'query'
 messages: Array<{time: string, from: string | null, text: string}>
 minimized: boolean
 showUsers?: boolean
 historyLoaded?: boolean
 lastHistoryTime?: number
 scrollRef?: HTMLDivElement
}

export const WirssiChat: Component<WirssiChatProps> = (props) => {
 const [boxes, setBoxes] = createSignal<ChatBox[]>([])
 const [nick, setNick] = createSignal(props.nick || 'user' + Math.floor(Math.random() * 9999))
 const [connected, setConnected] = createSignal(false)
 const [ws, setWs] = createSignal<WebSocket | null>(null)
 const [historyWs, setHistoryWs] = createSignal<WebSocket | null>(null)
 const [users, setUsers] = createSignal<{[key: string]: {[nick: string]: string}}>({})
 const messageSet = new Set<string>()
 const scrollRefs = new Map<string, HTMLDivElement>()

 const server = props.server || 'wss://irc.rotko.net/webirc'
 const channel = props.channel || '#rotko'
 const position = props.position || 'bottom-right'

 const positionClasses = {
   'bottom-right': 'bottom-0 right-0 flex-row-reverse',
   'bottom-left': 'bottom-0 left-0',
   'top-right': 'top-0 right-0 flex-row-reverse',
   'top-left': 'top-0 left-0'
 }

 const scrollToBottom = (boxId: string) => {
   const ref = scrollRefs.get(boxId)
   if (ref) {
     requestAnimationFrame(() => {
       ref.scrollTop = ref.scrollHeight
     })
   }
 }

 const connectHistory = () => {
   try {
     const histSocket = new WebSocket('wss://ircstore.rotko.net/ws')
     
     histSocket.onopen = () => {
       console.log('Connected to ircstore history')
     }
     
     histSocket.onmessage = (e) => {
       try {
         const event = JSON.parse(e.data)
         const boxId = event.channel || '_global'
         const box = getBox(boxId)
         
         if (box && !box.historyLoaded) {
           const msgKey = `${event.timestamp}-${event.nick}-${event.message}`
           if (!messageSet.has(msgKey)) {
             messageSet.add(msgKey)
             const time = new Date(event.timestamp * 1000).toTimeString().slice(0, 5)
             
             let from = event.nick
             let text = event.message
             if (event.message.startsWith('***')) {
               from = null
               text = event.message.replace(/^\*\*\* /, '')
             }
             
             setBoxes(boxes => boxes.map(b => 
               b.id === boxId 
                 ? {
                     ...b, 
                     messages: [...b.messages, { time, from, text }].slice(-100),
                     lastHistoryTime: event.timestamp
                   }
                 : b
             ))
             scrollToBottom(boxId)
           }
         }
       } catch (err) {
         console.error('Failed to parse history:', err)
       }
     }
     
     histSocket.onerror = () => {
       console.log('ircstore history not available')
     }
     
     setHistoryWs(histSocket)
   } catch (err) {
     console.log('ircstore history connection failed:', err)
   }
 }

 const connect = () => {
   const socket = new WebSocket(server)

   socket.onopen = () => {
     setConnected(true)
     socket.send(`NICK ${nick()}\r\n`)
     socket.send(`USER ${nick()} 0 * :Wirssi User\r\n`)
     setTimeout(() => {
       socket.send(`JOIN ${channel}\r\n`)
       addBox(channel, 'channel')
       loadHistory(channel)
     }, 1000)
   }

   socket.onmessage = (e) => {
     const lines = e.data.split('\r\n')
     lines.forEach(line => {
       if (!line) return

       if (line.startsWith('PING')) {
         socket.send('PONG' + line.slice(4) + '\r\n')
         return
       }

       const privmsg = line.match(/^:([^!]+)![^ ]+ PRIVMSG ([^ ]+) :(.*)$/)
       if (privmsg) {
         const [, from, to, msg] = privmsg
         if (to.startsWith('#')) {
           addMessage(to, from, msg)
         } else if (to === nick()) {
           if (!getBox(from)) addBox(from, 'query')
           addMessage(from, from, msg)
         }
         return
       }

       const topic = line.match(/^:[^ ]+ (331|332) [^ ]+ ([^ ]+) :?(.*)$/)
       if (topic) {
         const [, code, chan, text] = topic
         if (code === '332' && text) {
           addMessage(chan, null, `Topic: ${text}`)
         } else if (code === '331') {
           addMessage(chan, null, "No topic set")
         }
         return
       }

       const topicChange = line.match(/^:([^!]+)![^ ]+ TOPIC ([^ ]+) :(.*)$/)
       if (topicChange) {
         const [, who, chan, newTopic] = topicChange
         addMessage(chan, null, `${who} changed topic to: ${newTopic}`)
         return
       }

       const join = line.match(/^:([^!]+)![^ ]+ JOIN :?(.+)$/)
       if (join) {
         const [, who, chan] = join
         if (who === nick()) {
           // We joined - topic will be sent automatically
         } else {
           addMessage(chan, null, `${who} joined`)
           setUsers(u => {
             const chanUsers = {...(u[chan] || {})}
             chanUsers[who] = ''
             return {...u, [chan]: chanUsers}
           })
         }
         return
       }
       
       const part = line.match(/^:([^!]+)![^ ]+ PART ([^ ]+)(.*)$/)
       if (part) {
         const [, who, chan, reason] = part
         const reasonText = reason.match(/:(.*)$/)?.[1] || ''
         addMessage(chan, null, `${who} left${reasonText ? ` (${reasonText})` : ''}`)
         setUsers(u => {
           const chanUsers = {...(u[chan] || {})}
           delete chanUsers[who]
           return {...u, [chan]: chanUsers}
         })
         return
       }

       const quit = line.match(/^:([^!]+)![^ ]+ QUIT :?(.*)$/)
       if (quit) {
         const [, who, reason] = quit
         boxes().forEach(box => {
           if (box.type === 'channel' && users()[box.id]?.[who] !== undefined) {
             addMessage(box.id, null, `${who} quit${reason ? ` (${reason})` : ''}`)
             setUsers(u => {
               const chanUsers = {...u[box.id]}
               delete chanUsers[who]
               return {...u, [box.id]: chanUsers}
             })
           }
         })
         return
       }
       
       const nickChange = line.match(/^:([^!]+)![^ ]+ NICK :?(.+)$/)
       if (nickChange) {
         const [, oldNick, newNick] = nickChange
         if (oldNick === nick()) {
           setNick(newNick)
         }
         boxes().forEach(box => {
           if (box.type === 'channel' && users()[box.id]?.[oldNick] !== undefined) {
             addMessage(box.id, null, `${oldNick} is now known as ${newNick}`)
             setUsers(u => {
               const chanUsers = {...u[box.id]}
               chanUsers[newNick] = chanUsers[oldNick]
               delete chanUsers[oldNick]
               return {...u, [box.id]: chanUsers}
             })
           }
         })
         return
       }

       const names = line.match(/^:[^ ]+ 353 [^ ]+ . ([^ ]+) :(.+)$/)
       if (names) {
         const [, chan, nicks] = names
         const nickMap: {[nick: string]: string} = {}
         nicks.split(' ').forEach(n => {
           if (n.startsWith('@')) {
             const cleanNick = n.slice(1)
             if (cleanNick !== nick()) nickMap[cleanNick] = '@'
           } else if (n.startsWith('+')) {
             const cleanNick = n.slice(1)
             if (cleanNick !== nick()) nickMap[cleanNick] = '+'
           } else if (n && n !== nick()) {
             nickMap[n] = ''
           }
         })
         setUsers(u => ({...u, [chan]: {...(u[chan] || {}), ...nickMap}}))
         return
       }

       const mode = line.match(/^:([^!]+)![^ ]+ MODE ([^ ]+) ([+-][ov]) (.+)$/)
       if (mode) {
         const [, , chan, modeStr, target] = mode
         const adding = modeStr[0] === '+'
         const modeChar = modeStr[1]
         setUsers(u => {
           const chanUsers = {...(u[chan] || {})}
           if (chanUsers[target] !== undefined) {
             if (adding) {
               chanUsers[target] = modeChar === 'o' ? '@' : modeChar === 'v' ? '+' : ''
             } else {
               chanUsers[target] = ''
             }
           }
           return {...u, [chan]: chanUsers}
         })
       }
     })
   }

   socket.onerror = () => setConnected(false)
   socket.onclose = () => setConnected(false)

   setWs(socket)
 }

 const addBox = (id: string, type: 'channel' | 'query') => {
   if (!getBox(id)) {
     setBoxes(b => [...b, { 
       id, 
       type, 
       messages: [], 
       minimized: false,
       historyLoaded: false,
       showUsers: type === 'channel'
     }])
   }
 }

 const getBox = (id: string) => boxes().find(b => b.id === id)

 const loadHistory = async (channel: string) => {
   try {
     const response = await fetch(`https://ircstore.rotko.net/api/logs/${encodeURIComponent(channel)}?limit=50`)
     if (!response.ok) {
       console.log('History not available for', channel)
       setBoxes(boxes => boxes.map(b => 
         b.id === channel ? {...b, historyLoaded: true} : b
       ))
       return
     }
     
     const logs = await response.json()
     
     const box = getBox(channel)
     if (box && logs.length > 0) {
       const messages = logs.map(event => {
         const msgKey = `${event.timestamp}-${event.nick}-${event.message}`
         messageSet.add(msgKey)
         
         const time = new Date(event.timestamp * 1000).toTimeString().slice(0, 5)
         let from = event.nick
         let text = event.message
         
         if (event.message.startsWith('***')) {
           from = null
           text = event.message.replace(/^\*\*\* /, '')
         }
         
         return { time, from, text }
       })
       
       setBoxes(boxes => boxes.map(b => 
         b.id === channel 
           ? {...b, messages, historyLoaded: true, lastHistoryTime: logs[logs.length - 1]?.timestamp}
           : b
       ))
       setTimeout(() => scrollToBottom(channel), 100)
     } else {
       setBoxes(boxes => boxes.map(b => 
         b.id === channel ? {...b, historyLoaded: true} : b
       ))
     }
   } catch (err) {
     console.log('Failed to load history:', err)
     setBoxes(boxes => boxes.map(b => 
       b.id === channel ? {...b, historyLoaded: true} : b
     ))
   }
 }

 const addMessage = (boxId: string, from: string | null, text: string) => {
   const time = new Date().toTimeString().slice(0, 5)
   const timestamp = Math.floor(Date.now()/1000)
   const msgKey = `${timestamp}-${from}-${text}`
   
   if (messageSet.has(msgKey)) return
   
   if (messageSet.size > 1000) {
     const keys = Array.from(messageSet)
     keys.slice(0, 500).forEach(k => messageSet.delete(k))
   }
   
   messageSet.add(msgKey)
   setBoxes(boxes => boxes.map(b => 
     b.id === boxId 
       ? {...b, messages: [...b.messages, { time, from, text }].slice(-100)}
       : b
   ))
   
   setTimeout(() => scrollToBottom(boxId), 10)
 }

 const sendMessage = (boxId: string, msg: string) => {
   const socket = ws()
   if (!msg || !connected() || !socket) return

   if (msg.startsWith('/')) {
     const parts = msg.slice(1).split(' ')
     const cmd = parts[0].toUpperCase()

     if (cmd === 'NICK' && parts[1]) {
       setNick(parts[1])
       socket.send(`NICK ${parts[1]}\r\n`)
     } else if (cmd === 'JOIN' && parts[1]) {
       socket.send(`JOIN ${parts[1]}\r\n`)
       addBox(parts[1], 'channel')
       loadHistory(parts[1])
     } else if (cmd === 'PART') {
       socket.send(`PART ${boxId}\r\n`)
       closeBox(boxId)
     } else if (cmd === 'QUIT') {
       socket.send(`QUIT :${parts.slice(1).join(' ') || 'Leaving'}\r\n`)
       setConnected(false)
     } else {
       socket.send(msg.slice(1) + '\r\n')
     }
   } else {
     socket.send(`PRIVMSG ${boxId} :${msg}\r\n`)
     addMessage(boxId, nick(), msg)
   }
 }

 const closeBox = (id: string) => {
   const socket = ws()
   if (socket && id.startsWith('#')) {
     socket.send(`PART ${id}\r\n`)
   }
   setBoxes(b => b.filter(box => box.id !== id))
   scrollRefs.delete(id)
   
   setUsers(u => {
     const newUsers = {...u}
     delete newUsers[id]
     return newUsers
   })
 }

 const toggleMinimize = (id: string) => {
   setBoxes(boxes => boxes.map(b => 
     b.id === id ? {...b, minimized: !b.minimized} : b
   ))
   if (!getBox(id)?.minimized) {
     setTimeout(() => scrollToBottom(id), 10)
   }
 }

 const toggleUsers = (id: string) => {
   setBoxes(boxes => boxes.map(b => 
     b.id === id ? {...b, showUsers: !b.showUsers} : b
   ))
 }

 const openQuery = (user: string) => {
   addBox(user, 'query')
 }

 const getSortedUsers = (chan: string) => {
   const chanUsers = users()[chan] || {}
   return Object.entries(chanUsers).sort((a, b) => {
     const prefixOrder = {'@': 0, '+': 1, '': 2}
     const prefixDiff = prefixOrder[a[1] as '@'|'+'|''] - prefixOrder[b[1] as '@'|'+'|'']
     if (prefixDiff !== 0) return prefixDiff
     return a[0].localeCompare(b[0])
   })
 }

 createEffect(() => {
   if (!connected()) {
     setTimeout(connect, 100)
     setTimeout(connectHistory, 200)
   }
 })

 onCleanup(() => {
   ws()?.close()
   historyWs()?.close()
 })

 return (
   <div class={`fixed ${positionClasses[position]} flex items-end gap-1 p-2 z-50`}>
     <For each={boxes()}>
       {(box) => (
         <div class={`bg-gray-900 border border-gray-700 rounded-t shadow-lg ${
           box.type === 'channel' ? 'w-96' : 'w-64'
         }`}>
           {/* Header */}
           <div class="bg-gray-800 px-2 py-0.5 flex items-center justify-between cursor-pointer h-6"
             onClick={() => toggleMinimize(box.id)}>
             <span class="text-white font-mono text-xs flex items-center gap-1">
               {box.id}
               <Show when={box.type === 'channel'}>
                 <span class="text-gray-500">({Object.keys(users()[box.id] || {}).length + 1})</span>
               </Show>
             </span>
             <div class="flex gap-1 items-center">
               <Show when={box.type === 'channel'}>
                 <button onClick={(e) => { e.stopPropagation(); toggleUsers(box.id) }}
                   class="text-gray-400 hover:text-white text-xs">
                   {box.showUsers ? '▶' : '◀'}
                 </button>
               </Show>
               <button onClick={(e) => { e.stopPropagation(); closeBox(box.id) }}
                 class="text-gray-400 hover:text-white text-sm">✕</button>
             </div>
           </div>

           <Show when={!box.minimized}>
             <div class="flex">
               {/* Messages */}
               <div class="flex-1 h-80 flex flex-col">
                 <div 
                   ref={(el) => scrollRefs.set(box.id, el)}
                   class="flex-1 overflow-y-auto p-1 bg-black"
                 >
                   <Show when={!connected() && box.id === channel}>
                     <div class="text-xs font-mono text-yellow-400 text-center py-1">
                       Connecting to IRC...
                     </div>
                   </Show>
                   <For each={box.messages}>
                     {(msg) => (
                       <div class="text-xs font-mono text-white">
                         <span class="text-gray-500">{msg.time}</span>
                         <Show when={msg.from}>
                           <span class="text-cyan-300 ml-1">&lt;{msg.from}&gt;</span>
                         </Show>
                         <span class={msg.from ? ' ml-1' : ' text-gray-400'}>{msg.text}</span>
                       </div>
                     )}
                   </For>
                 </div>

                 {/* Input */}
                 <input
                   type="text"
                   class="bg-gray-800 text-white px-2 py-1 text-xs font-mono outline-none border-t border-gray-700"
                   placeholder="Type message..."
                   onKeyPress={(e) => {
                     if (e.key === 'Enter') {
                       sendMessage(box.id, e.currentTarget.value)
                       e.currentTarget.value = ''
                     }
                   }}
                 />
               </div>

               {/* User list for channels */}
               <Show when={box.type === 'channel' && box.showUsers}>
                 <div class="w-20 bg-gray-900 border-l border-gray-800 overflow-y-auto">
                   <div class="px-1 py-0.5 text-cyan-300 text-xs font-mono border-b border-gray-800">
                     {nick()}
                   </div>
                   <For each={getSortedUsers(box.id)}>
                     {([user, prefix]) => (
                       <div 
                         class="px-1 py-0.5 hover:bg-gray-800 cursor-pointer text-xs font-mono text-white truncate"
                         onClick={() => openQuery(user)}
                         title={user}
                       >
                         <span class={prefix === '@' ? 'text-yellow-400' : prefix === '+' ? 'text-green-400' : ''}>
                           {prefix}
                         </span>
                         {user}
                       </div>
                     )}
                   </For>
                 </div>
               </Show>
             </div>
           </Show>
         </div>
       )}
     </For>
   </div>
 )
}

export default WirssiChat
