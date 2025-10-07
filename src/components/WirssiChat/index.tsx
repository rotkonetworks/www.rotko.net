import { createSignal, createEffect, For, Component, onCleanup } from 'solid-js'
import { ChatBox } from './ChatBox'
import { parseIrcMessage, parseNickList } from './ircParser'
import { loadChannelHistory, connectHistoryStream } from './historyLoader'
import type { WirssiChatProps, ChatBox as ChatBoxType, Users } from './types'

export const WirssiChat: Component<WirssiChatProps> = (props) => {
 const [boxes, setBoxes] = createSignal<ChatBoxType[]>([])
 const [nick, setNick] = createSignal(props.nick || 'user' + Math.floor(Math.random() * 9999))
 const [connected, setConnected] = createSignal(false)
 const [ws, setWs] = createSignal<WebSocket | null>(null)
 const [historyWs, setHistoryWs] = createSignal<WebSocket | null>(null)
 const [users, setUsers] = createSignal<Users>({})
 const [showNickChange, setShowNickChange] = createSignal<string | null>(null)
 const [activeTabIndex, setActiveTabIndex] = createSignal(0)
 const messageSet = new Set<string>()
 const scrollRefs = new Map<string, HTMLDivElement>()

 const server = props.server || 'wss://irc.rotko.net/webirc'
 const channel = props.channel || '#rotko'
 const position = props.position || 'bottom-right'

 const positionClasses = {
   'bottom-right': 'bottom-0 right-0 sm:flex-row-reverse',
   'bottom-left': 'bottom-0 left-0',
   'top-right': 'top-0 right-0 sm:flex-row-reverse',
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

 const addBox = (id: string, type: 'channel' | 'query') => {
   if (!boxes().find(b => b.id === id)) {
     const newBoxes = [...boxes(), {
       id,
       type,
       messages: [],
       minimized: false,
       historyLoaded: false,
       showUsers: type === 'channel'
     }]
     setBoxes(newBoxes)
     // Set active tab to the new box on mobile
     setActiveTabIndex(newBoxes.length - 1)
     if (type === 'channel') {
       loadHistory(id)
     }
   }
 }

 const loadHistory = async (channelId: string) => {
   const result = await loadChannelHistory(channelId, messageSet)
   if (result) {
     setBoxes(boxes => boxes.map(b => 
       b.id === channelId 
         ? {...b, messages: result.messages, historyLoaded: true, lastHistoryTime: result.lastTimestamp}
         : b
     ))
     setTimeout(() => scrollToBottom(channelId), 100)
   } else {
     setBoxes(boxes => boxes.map(b => 
       b.id === channelId ? {...b, historyLoaded: true} : b
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

 const handleIrcMessage = (line: string) => {
   const parsed = parseIrcMessage(line)
   if (!parsed) return
   
   const { type, match, data } = parsed
   
   switch (type) {
     case 'PING':
       ws()?.send('PONG' + data + '\r\n')
       break
       
     case 'privmsg': {
       const [, from, to, msg] = match
       if (to.startsWith('#')) {
         addMessage(to, from, msg)
       } else if (to === nick()) {
         if (!boxes().find(b => b.id === from)) addBox(from, 'query')
         addMessage(from, from, msg)
       }
       break
     }
     
     case 'topic': {
       const [, code, chan, text] = match
       if (code === '332' && text) {
         addMessage(chan, null, `Topic: ${text}`)
       } else if (code === '331') {
         addMessage(chan, null, "No topic set")
       }
       break
     }
     
     case 'join': {
       const [, who, chan] = match
       if (who !== nick()) {
         addMessage(chan, null, `${who} joined`)
         setUsers(u => {
           const chanUsers = {...(u[chan] || {})}
           chanUsers[who] = ''
           return {...u, [chan]: chanUsers}
         })
       }
       break
     }
     
     case 'part': {
       const [, who, chan, reason] = match
       const reasonText = reason.match(/:(.*)$/)?.[1] || ''
       addMessage(chan, null, `${who} left${reasonText ? ` (${reasonText})` : ''}`)
       setUsers(u => {
         const chanUsers = {...(u[chan] || {})}
         delete chanUsers[who]
         return {...u, [chan]: chanUsers}
       })
       break
     }
     
     case 'quit': {
       const [, who, reason] = match
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
       break
     }
     
     case 'nick': {
       const [, oldNick, newNick] = match
       if (oldNick === nick()) {
         setNick(newNick)
         boxes().forEach(box => {
           addMessage(box.id, null, `You are now known as ${newNick}`)
         })
       } else {
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
       }
       break
     }
     
     case 'names': {
       const [, chan, nicks] = match
       const nickMap = parseNickList(nicks, nick())
       setUsers(u => ({...u, [chan]: {...(u[chan] || {}), ...nickMap}}))
       break
     }
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
     }, 1000)
   }

   socket.onmessage = (e) => {
     const lines = e.data.split('\r\n')
     lines.forEach(line => {
       if (line) handleIrcMessage(line)
     })
   }

   socket.onerror = () => setConnected(false)
   socket.onclose = () => setConnected(false)

   setWs(socket)
 }

 const sendMessage = (boxId: string, msg: string) => {
   const socket = ws()
   if (!msg || !connected() || !socket) return

   if (msg.startsWith('/')) {
     const parts = msg.slice(1).split(' ')
     const cmd = parts[0].toUpperCase()

     if (cmd === 'NICK' && parts[1]) {
       const oldNick = nick()
       setNick(parts[1])
       socket.send(`NICK ${parts[1]}\r\n`)
       addMessage(boxId, null, `Attempting to change nick from ${oldNick} to ${parts[1]}`)
     } else if (cmd === 'JOIN' && parts[1]) {
       socket.send(`JOIN ${parts[1]}\r\n`)
       addBox(parts[1], 'channel')
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

   // Find the index of the box being closed
   const currentBoxes = boxes()
   const closedIndex = currentBoxes.findIndex(box => box.id === id)

   // Update boxes and check if this was the last one
   const updatedBoxes = currentBoxes.filter(box => box.id !== id)
   setBoxes(updatedBoxes)
   scrollRefs.delete(id)
   setUsers(u => {
     const newUsers = {...u}
     delete newUsers[id]
     return newUsers
   })

   // Adjust active tab index if needed
   if (updatedBoxes.length > 0) {
     const currentActiveIndex = activeTabIndex()
     if (closedIndex <= currentActiveIndex && currentActiveIndex > 0) {
       setActiveTabIndex(currentActiveIndex - 1)
     } else if (currentActiveIndex >= updatedBoxes.length) {
       setActiveTabIndex(updatedBoxes.length - 1)
     }
   }

   // If all boxes are now closed, call the onClose callback
   if (updatedBoxes.length === 0 && props.onClose) {
     props.onClose()
   }
 }

 createEffect(() => {
   if (!connected()) {
     setTimeout(connect, 100)
     const histWs = connectHistoryStream((event) => {
       const boxId = event.channel || '_global'
       const box = boxes().find(b => b.id === boxId)
       
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
           addMessage(boxId, from, text)
         }
       }
     })
     if (histWs) setHistoryWs(histWs)
   }
 })

 onCleanup(() => {
   ws()?.close()
   historyWs()?.close()
 })

 return (
   <div class={`fixed ${positionClasses[position]} flex flex-col sm:flex-row items-end gap-1 pr-2 pt-2 z-50 max-h-screen overflow-y-auto sm:overflow-visible`}>
     {/* Mobile Tab Bar */}
     <Show when={boxes().length > 0}>
       <div class="sm:hidden w-[calc(100vw-1rem)] mb-1">
         <div class="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded flex overflow-x-auto scrollbar-hide">
           <For each={boxes()}>
             {(box, index) => (
               <button
                 onClick={() => setActiveTabIndex(index())}
                 class={`px-3 py-1 text-xs font-mono whitespace-nowrap transition-all duration-200 flex-shrink-0 relative ${
                   index() === activeTabIndex()
                     ? 'bg-gray-600 text-white shadow-lg'
                     : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                 }`}
               >
                 {/* Active tab indicator */}
                 <Show when={index() === activeTabIndex()}>
                   <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-300 rounded-t"></div>
                 </Show>
                 {box.id}
                 <Show when={box.type === 'channel'}>
                   <span class={`ml-1 ${index() === activeTabIndex() ? 'text-gray-300' : 'text-gray-500'}`}>
                     ({Object.keys(users()[box.id] || {}).length + 1})
                   </span>
                 </Show>
               </button>
             )}
           </For>
         </div>
       </div>
     </Show>

     {/* Desktop: All boxes side by side, Mobile: Only active box */}
     <div class="hidden sm:flex flex-row items-end gap-1">
       <For each={boxes()}>
         {(box) => (
           <ChatBox
             box={box}
             nick={nick()}
             connected={connected()}
             defaultChannel={channel}
             users={users()}
             showNickChange={showNickChange()}
             onMinimize={(id) => setBoxes(boxes => boxes.map(b =>
               b.id === id ? {...b, minimized: !b.minimized} : b
             ))}
             onClose={closeBox}
             onToggleUsers={(id) => setBoxes(boxes => boxes.map(b =>
               b.id === id ? {...b, showUsers: !b.showUsers} : b
             ))}
             onSendMessage={sendMessage}
             onToggleNickChange={setShowNickChange}
             onOpenQuery={(user) => addBox(user, 'query')}
             scrollRef={(el) => scrollRefs.set(box.id, el)}
             isMobile={false}
           />
         )}
       </For>
     </div>

     {/* Mobile: Card stack with smooth transitions */}
     <Show when={boxes().length > 0}>
       <div class="sm:hidden relative w-[calc(100vw-1rem)] min-h-[20rem]">
         <For each={boxes()}>
           {(box, index) => (
             <div
               class={`absolute inset-0 transition-all duration-300 ease-in-out transform-gpu ${
                 index() === activeTabIndex()
                   ? 'opacity-100 translate-x-0 scale-100 z-20'
                   : index() < activeTabIndex()
                   ? 'opacity-0 -translate-x-8 scale-95 z-0'
                   : 'opacity-0 translate-x-8 scale-95 z-0'
               }`}
               style={{
                 // Add subtle shadow and transform for card stack effect
                 'transform-origin': 'center center',
                 'backface-visibility': 'hidden',
               }}
             >
               <ChatBox
                 box={box}
                 nick={nick()}
                 connected={connected()}
                 defaultChannel={channel}
                 users={users()}
                 showNickChange={showNickChange()}
                 onMinimize={(id) => setBoxes(boxes => boxes.map(b =>
                   b.id === id ? {...b, minimized: !b.minimized} : b
                 ))}
                 onClose={closeBox}
                 onToggleUsers={(id) => setBoxes(boxes => boxes.map(b =>
                   b.id === id ? {...b, showUsers: !b.showUsers} : b
                 ))}
                 onSendMessage={sendMessage}
                 onToggleNickChange={setShowNickChange}
                 onOpenQuery={(user) => addBox(user, 'query')}
                 scrollRef={(el) => scrollRefs.set(box.id, el)}
                 isMobile={true}
               />
             </div>
           )}
         </For>
       </div>
     </Show>
   </div>
 )
}

export default WirssiChat
