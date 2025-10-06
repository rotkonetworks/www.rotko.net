import { Component, createContext, createSignal, useContext, JSX } from 'solid-js'
import WirssiChat from '../components/WirssiChat'

interface ChatContextType {
  isChatOpen: boolean
  setIsChatOpen: (value: boolean) => void
  toggleChat: () => void
  openChat: () => void
}

const ChatContext = createContext<ChatContextType>()

export const ChatProvider: Component<{ children: JSX.Element }> = (props) => {
  const [isChatOpen, setIsChatOpen] = createSignal(false)

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen())
  }

  const openChat = () => {
    setIsChatOpen(true)
  }

  const value = {
    get isChatOpen() { return isChatOpen() },
    setIsChatOpen,
    toggleChat,
    openChat
  }

  return (
    <ChatContext.Provider value={value}>
      {props.children}
      {isChatOpen() && (
        <WirssiChat
          server="wss://irc.rotko.net/webirc"
          channel="#rotko"
          position="bottom-right"
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}