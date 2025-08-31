import { Component, JSX, Show, createSignal } from 'solid-js'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WirssiChat from '../components/WirssiChat'
import { siteData } from '../data/site-data'

interface MainLayoutProps {
  children: JSX.Element
  showChat?: boolean
}

const MainLayout: Component<MainLayoutProps> = (props) => {
  const [chatOpen, setChatOpen] = createSignal(false)

  return (
    <div class="min-h-screen bg-black text-white">
      <Header onChatToggle={() => setChatOpen(!chatOpen())} />
      
      <main class="flex-1">
        {props.children}
      </main>

      <Footer />

      <Show when={chatOpen()}>
        <WirssiChat 
          server={siteData.contact.irc.server}
          channel={siteData.contact.irc.channel}
          position="bottom-right"
        />
      </Show>
    </div>
  )
}

export default MainLayout
