import { Component, createSignal, onMount, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { contactData } from '../data/contact-data'
import WirssiChat from '../components/WirssiChat'

const ContactPage: Component = () => {
  const [visible, setVisible] = createSignal(false)
  const [copied, setCopied] = createSignal<string | null>(null)

  onMount(() => {
    setTimeout(() => setVisible(true), 100)
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <MainLayout>
      <section class="py-24 px-6 lg:px-12 max-w-4xl mx-auto">
        <div class={`transition-all duration-700 ${visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Header */}
          <div class="mb-16">
            <h1 class="text-4xl lg:text-5xl font-bold mb-4 text-cyan-400 font-mono">
              {contactData.hero.title}
            </h1>
            <p class="text-xl text-gray-400">
              {contactData.hero.subtitle}
            </p>
          </div>

          {/* Connection Info */}
          <div class="mb-12 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-4 text-cyan-400 font-mono">IRC Server</h2>
            <div class="space-y-3 font-mono text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Server:</span>
                <button
                  onClick={() => copyToClipboard(contactData.connection.server, 'server')}
                  class="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {contactData.connection.server}
                  {copied() === 'server' && <span class="text-xs ml-2">✓</span>}
                </button>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Ports:</span>
                <span class="text-gray-300">{contactData.connection.ports}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Channel:</span>
                <span class="text-cyan-400">{contactData.connection.channel}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-gray-400">Tor:</span>
                <button
                  onClick={() => copyToClipboard(contactData.connection.tor, 'tor')}
                  class="text-cyan-400 text-xs hover:text-cyan-300 bg-transparent transition-colors text-right break-all max-w-xs"
                >
                  {contactData.connection.tor}
                  {copied() === 'tor' && <span class="text-xs ml-2">✓</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Why IRC */}
          <div class="mb-12">
            <h2 class="text-xl font-bold mb-4 text-cyan-400">{contactData.philosophy.title}</h2>
            <div class="space-y-3 text-gray-300 text-sm">
              <For each={contactData.philosophy.content}>
                {(paragraph) => <p>{paragraph}</p>}
              </For>
            </div>
          </div>

          {/* Rules & Expectations */}
          <div class="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 class="text-lg font-bold mb-3 text-cyan-400">{contactData.rules.title}</h3>
              <ul class="space-y-2 text-sm">
                <For each={contactData.rules.items}>
                  {(rule) => (
                    <li class="text-gray-300">• {rule}</li>
                  )}
                </For>
              </ul>
            </div>
            <div>
              <h3 class="text-lg font-bold mb-3 text-cyan-400">{contactData.expectations.title}</h3>
              <ul class="space-y-2 text-sm">
                <For each={contactData.expectations.items}>
                  {(item) => (
                    <li class="text-gray-300">✓ {item}</li>
                  )}
                </For>
              </ul>
            </div>
          </div>

          {/* Email fallback */}
          <div class="text-center text-sm text-gray-400 border-t border-gray-800 pt-6">
            <p>Email fallback: hq@rotko.net</p>
            <p class="text-xs mt-2">IRC preferred for real-time support</p>
          </div>
        </div>
      </section>

      {/* Auto-open IRC widget */}
      <WirssiChat
        server="wss://irc.rotko.net/webirc"
        channel="#rotko"
        position="bottom-right"
      />
    </MainLayout>
  )
}

export default ContactPage
