import { Component, Show, For } from 'solid-js'
import type { ChatBox as ChatBoxType, Users } from './types'

interface ChatBoxProps {
 box: ChatBoxType
 nick: string
 connected: boolean
 defaultChannel: string
 users: Users
 showNickChange: string | null
 onMinimize: (id: string) => void
 onClose: (id: string) => void
 onToggleUsers: (id: string) => void
 onSendMessage: (boxId: string, msg: string) => void
 onToggleNickChange: (boxId: string | null) => void
 onOpenQuery: (user: string) => void
 scrollRef: (el: HTMLDivElement) => void
 isMobile: boolean
}

export const ChatBox: Component<ChatBoxProps> = (props) => {
 const getSortedUsers = () => {
   const chanUsers = props.users[props.box.id] || {}
   return Object.entries(chanUsers).sort((a, b) => {
     const prefixOrder = {'@': 0, '+': 1, '': 2}
     const prefixDiff = prefixOrder[a[1] as '@'|'+'|''] - prefixOrder[b[1] as '@'|'+'|'']
     if (prefixDiff !== 0) return prefixDiff
     return a[0].localeCompare(b[0])
   })
 }

 return (
   <div class={`bg-gray-900/90 backdrop-blur-sm border border-gray-700 shadow-lg
     w-[calc(100vw-1rem)] sm:w-auto
     ${props.box.type === 'channel' ? 'sm:w-96' : 'sm:w-64'}
     max-w-full
     ${props.isMobile ? 'rounded' : 'rounded-t'}
   `}>
     {/* Header - Hidden on mobile when used in card stack */}
     <Show when={!props.isMobile}>
       <div class="bg-gray-800/90 px-2 py-0.5 flex items-center justify-between cursor-pointer h-6"
         onClick={() => props.onMinimize(props.box.id)}>
         <span class="text-white font-mono text-xs flex items-center gap-1">
           {props.box.id}
           <Show when={props.box.type === 'channel'}>
             <span class="text-gray-500">
               ({Object.keys(props.users[props.box.id] || {}).length + 1})
             </span>
           </Show>
         </span>
         <div class="flex gap-1 items-center">
           <Show when={props.box.type === 'channel'}>
             <button onClick={(e) => {
               e.stopPropagation()
               props.onToggleUsers(props.box.id)
             }}
               class="text-gray-400 hover:text-white text-xs">
               {props.box.showUsers ? '▶' : '◀'}
             </button>
           </Show>
           <button onClick={(e) => {
             e.stopPropagation()
             props.onClose(props.box.id)
           }}
             class="text-gray-400 hover:text-white text-sm">✕</button>
         </div>
       </div>
     </Show>

     {/* Mobile Header with just close button */}
     <Show when={props.isMobile}>
       <div class="bg-gray-800/90 px-2 py-0.5 flex items-center justify-between h-6">
         <span class="text-white font-mono text-xs flex items-center gap-1">
           {props.box.id}
           <Show when={props.box.type === 'channel'}>
             <span class="text-gray-500">
               ({Object.keys(props.users[props.box.id] || {}).length + 1})
             </span>
           </Show>
         </span>
         <div class="flex gap-1 items-center">
           <Show when={props.box.type === 'channel'}>
             <button onClick={() => props.onToggleUsers(props.box.id)}
               class="text-gray-400 hover:text-white text-xs">
               {props.box.showUsers ? '▶' : '◀'}
             </button>
           </Show>
           <button onClick={() => props.onClose(props.box.id)}
             class="text-gray-400 hover:text-white text-sm">✕</button>
         </div>
       </div>
     </Show>

     <Show when={!props.box.minimized}>
       <div class="flex">
         {/* Messages */}
         <div class="flex-1 h-48 sm:h-80 flex flex-col">
           <div 
             ref={props.scrollRef}
             class="flex-1 overflow-y-auto p-1 bg-black"
           >
             <Show when={!props.connected && props.box.id === props.defaultChannel}>
               <div class="text-xs font-mono text-yellow-400 text-center py-1">
                 Connecting to IRC...
               </div>
             </Show>
             <For each={props.box.messages}>
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
           <div class="border-t border-gray-700">
             <Show when={props.showNickChange === props.box.id}>
               <div class="bg-gray-800/90 px-2 py-1 flex items-center gap-1">
                 <span class="text-xs text-gray-400">Nick:</span>
                 <input
                   type="text"
                   value={props.nick}
                   class="flex-1 bg-gray-700 text-white px-1 text-xs font-mono outline-none rounded"
                   placeholder="New nickname"
                   onKeyPress={(e) => {
                     if (e.key === 'Enter') {
                       props.onSendMessage(props.box.id, `/nick ${e.currentTarget.value}`)
                       props.onToggleNickChange(null)
                     }
                   }}
                   onBlur={() => props.onToggleNickChange(null)}
                 />
               </div>
             </Show>
             <div class="flex">
               <input
                 type="text"
                 class="flex-1 bg-gray-800/90 text-white px-2 py-1 text-xs font-mono outline-none"
                 placeholder="Type message..."
                 onKeyPress={(e) => {
                   if (e.key === 'Enter') {
                     props.onSendMessage(props.box.id, e.currentTarget.value)
                     e.currentTarget.value = ''
                   }
                 }}
               />
               <button
                 onClick={() => props.onToggleNickChange(
                   props.showNickChange === props.box.id ? null : props.box.id
                 )}
                 class="px-2 bg-gray-800/90 text-gray-400 hover:text-cyan-300 text-xs"
                 title="Change nickname"
               >
                 {props.nick}
               </button>
             </div>
           </div>
         </div>

         {/* User list */}
         <Show when={props.box.type === 'channel' && props.box.showUsers}>
           <div class={`w-20 bg-gray-900 border-l border-gray-800 overflow-y-auto ${props.isMobile ? 'block' : 'hidden sm:block'}`}>
             <div class="px-1 py-0.5 text-cyan-300 text-xs font-mono border-b border-gray-800">
               {props.nick}
             </div>
             <For each={getSortedUsers()}>
               {([user, prefix]) => (
                 <div
                   class="px-1 py-0.5 hover:bg-gray-800 cursor-pointer text-xs font-mono text-white truncate"
                   onClick={() => props.onOpenQuery(user)}
                   title={user}
                 >
                   <span class={
                     prefix === '@' ? 'text-yellow-400' :
                     prefix === '+' ? 'text-green-400' : ''
                   }>
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
 )
}
