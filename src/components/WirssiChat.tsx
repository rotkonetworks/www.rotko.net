import { createSignal, createEffect, For, Show, Component } from 'solid-js'

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
}

export const WirssiChat: Component<WirssiChatProps> = (props) => {
  const [boxes, setBoxes] = createSignal<ChatBox[]>([])
  const [nick, setNick] = createSignal(props.nick || 'user' + Math.floor(Math.random() * 9999))
  const [connected, setConnected] = createSignal(false)
  const [ws, setWs] = createSignal<WebSocket | null>(null)
  const [users, setUsers] = createSignal<{[key: string]: {[nick: string]: string}}>({})

  const server = props.server || 'wss://irc.rotko.net/webirc'
  const channel = props.channel || '#rotko'
  const position = props.position || 'bottom-right'

  const positionClasses = {
    'bottom-right': 'bottom-0 right-0 flex-row-reverse',
    'bottom-left': 'bottom-0 left-0',
    'top-right': 'top-0 right-0 flex-row-reverse',
    'top-left': 'top-0 left-0'
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
          if (who !== nick()) {
            setUsers(u => {
              const chanUsers = {...(u[chan] || {})}
              chanUsers[who] = ''
              return {...u, [chan]: chanUsers}
            })
          }
          return
        }
        
        const nickChange = line.match(/^:([^!]+)![^ ]+ NICK :?(.+)$/)
        if (nickChange) {
          const [, oldNick, newNick] = nickChange
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

        const leave = line.match(/^:([^!]+)![^ ]+ (PART|QUIT)(.*)$/)
        if (leave) {
          const [, who] = leave
          Object.keys(users()).forEach(chan => {
            if (users()[chan]?.[who] !== undefined) {
              setUsers(u => {
                const chanUsers = {...u[chan]}
                delete chanUsers[who]
                return {...u, [chan]: chanUsers}
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
        showUsers: type === 'channel'
      }])
    }
  }

  const getBox = (id: string) => boxes().find(b => b.id === id)

  const addMessage = (boxId: string, from: string | null, text: string) => {
    const time = new Date().toTimeString().slice(0, 5)
    setBoxes(boxes => boxes.map(b => 
      b.id === boxId 
        ? {...b, messages: [...b.messages, { time, from, text }].slice(-100)}
        : b
    ))
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
  }

  const toggleMinimize = (id: string) => {
    setBoxes(boxes => boxes.map(b => 
      b.id === id ? {...b, minimized: !b.minimized} : b
    ))
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
    }
  })

  return (
    <div class={`fixed ${positionClasses[position]} flex items-end gap-1 p-2`}>
      <Show when={!connected()}>
        <div class="bg-red-6 text-white px-3 py-1 rounded text-2.5">
          Connecting...
        </div>
      </Show>

      <For each={boxes()}>
        {(box) => (
          <div class={`bg-gray-9 border border-gray-7 rounded-t shadow-lg ${
box.type === 'channel' ? 'w-96' : 'w-64'
}`}>
            {/* Header */}
            <div class="bg-gray-8 px-2 py-0.5 flex items-center justify-between cursor-pointer h-6"
              onClick={() => toggleMinimize(box.id)}>
              <span class="text-white font-mono text-2.5 flex items-center gap-1">
                {box.id}
                <Show when={box.type === 'channel'}>
                  <span class="text-gray-5">({Object.keys(users()[box.id] || {}).length + 1})</span>
                </Show>
              </span>
              <div class="flex gap-1 items-center">
                <Show when={box.type === 'channel'}>
                  <button onClick={(e) => { e.stopPropagation(); toggleUsers(box.id) }}
                    class="text-gray-4 hover:text-white text-2.5">
                    {box.showUsers ? '▶' : '◀'}
                  </button>
                </Show>
                <button onClick={(e) => { e.stopPropagation(); closeBox(box.id) }}
                  class="text-gray-4 hover:text-white text-3">✕</button>
              </div>
            </div>

            <Show when={!box.minimized}>
              <div class="flex">
                {/* Messages */}
                <div class="flex-1 h-80 flex flex-col">
                  <div class="flex-1 overflow-y-auto p-1 bg-black">
                    <For each={box.messages}>
                      {(msg) => (
                        <div class="text-2.5 font-mono text-white">
                          <span class="text-gray-5">{msg.time}</span>
                          <Show when={msg.from}>
                            <span class="text-cyan-3 ml-1">&lt;{msg.from}&gt;</span>
                          </Show>
                          <span class={msg.from ? ' ml-1' : ' text-gray-4'}>{msg.text}</span>
                        </div>
                      )}
                    </For>
                  </div>

                  {/* Input */}
                  <input
                    type="text"
                    class="bg-gray-8 text-white px-2 py-1 text-2.5 font-mono outline-none border-t border-gray-7"
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
                  <div class="w-20 bg-gray-9 border-l border-gray-8 overflow-y-auto">
                    <div class="px-1 py-0.5 text-cyan-3 text-2 font-mono border-b border-gray-8">
                      {nick()}
                    </div>
                    <For each={getSortedUsers(box.id)}>
                      {([user, prefix]) => (
                        <div 
                          class="px-1 py-0.5 hover:bg-gray-8 cursor-pointer text-2 font-mono text-white truncate"
                          onClick={() => openQuery(user)}
                          title={user}
                        >
                          <span class={prefix === '@' ? 'text-yellow-4' : prefix === '+' ? 'text-green-4' : ''}>
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
