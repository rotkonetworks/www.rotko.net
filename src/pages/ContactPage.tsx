import { Component, createSignal, For, onMount } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { contactData } from '../data/contact-data'
import { useChat } from '../contexts/ChatProvider'

const ContactPage: Component = () => {
  const [copied, setCopied] = createSignal<string | null>(null)
  const { openChat } = useChat()

  // Auto-open chat when contact page loads
  onMount(() => {
    openChat()
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <div>
          
          {/* Header */}
          <div class="mb-8 border-b border-gray-700 pb-4">
            <h1 class="text-3xl font-bold text-cyan-400 mb-2">
              {contactData.hero.title}
            </h1>
            <p class="text-gray-300">
              {contactData.hero.subtitle}
            </p>
          </div>

          {/* Connection Info */}
          <div class="mb-8 border border-gray-700 bg-gray-900 p-6">
            <h2 class="text-xl font-bold mb-4 text-cyan-400">{contactData.connection.title}</h2>
            <div class="space-y-3 font-mono text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Server:</span>
                <button
                  onClick={() => copyToClipboard(contactData.connection.server, 'server')}
                  class="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {contactData.connection.server}
                  {copied() === 'server' && <span class="i-mdi-check text-xs ml-2"></span>}
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
                  {copied() === 'tor' && <span class="i-mdi-check text-xs ml-2"></span>}
                </button>
              </div>
            </div>
          </div>

          {/* Why IRC */}
          <div class="mb-8 border border-gray-700 bg-gray-900 p-6">
            <h2 class="text-xl font-bold mb-4 text-cyan-400">{contactData.philosophy.title}</h2>
            <div class="space-y-3 text-gray-300 text-sm">
              <For each={contactData.philosophy.content}>
                {(paragraph) => <p>{paragraph}</p>}
              </For>
            </div>
          </div>

          {/* Rules & Expectations */}
          <div class="grid md:grid-cols-2 gap-8 mb-8">
            <div class="border border-gray-700 bg-gray-900 p-6">
              <h3 class="text-lg font-bold mb-3 text-cyan-400">{contactData.rules.title}</h3>
              <ul class="space-y-2 text-sm">
                <For each={contactData.rules.items}>
                  {(rule) => (
                    <li class="text-gray-300">• {rule}</li>
                  )}
                </For>
              </ul>
            </div>
            <div class="border border-gray-700 bg-gray-900 p-6">
              <h3 class="text-lg font-bold mb-3 text-cyan-400">{contactData.expectations.title}</h3>
              <ul class="space-y-2 text-sm">
                <For each={contactData.expectations.items}>
                  {(item) => (
                    <li class="text-gray-300 flex items-center"><span class="i-mdi-check-circle text-cyan-400 mr-2"></span>{item}</li>
                  )}
                </For>
              </ul>
            </div>
          </div>

          {/* Email fallback */}
          <div class="border border-gray-700 bg-gray-900 p-6">
            <h2 class="text-xl font-bold text-cyan-400 mb-4">{contactData.alternativeContact.title}</h2>
            <div class="text-sm text-gray-300">
              <p class="mb-2">Email: {contactData.alternativeContact.email}</p>
              <p class="mb-3">Matrix: {contactData.alternativeContact.matrix}</p>
              <p class="text-xs text-gray-400">{contactData.alternativeContact.note}</p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default ContactPage
