import { Component, For, onMount, createSignal } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import NetworkCard from '../components/NetworkCard'
import ServiceCard from '../components/ServiceCard'
import { siteData } from '../data/site-data'
import { fetchCryptoPrices } from '../utils/fetchPrices'
import BlogPreview from '../components/BlogPreview'

const HomePage: Component = () => {
  const [networks, setNetworks] = createSignal(siteData.networks)

  onMount(async () => {
    const ids = siteData.networks
      .filter(n => n.coingeckoId)
      .map(n => n.coingeckoId!)

    const prices = await fetchCryptoPrices(ids)

    setNetworks(siteData.networks.map(network => {
      if (network.coingeckoId && prices[network.coingeckoId]) {
        return {
          ...network,
          price: {
            current: prices[network.coingeckoId].price,
            change24h: parseFloat(prices[network.coingeckoId].change24h.toFixed(2)),
            change30d: parseFloat(prices[network.coingeckoId].change30d.toFixed(2))
          }
        }
      }
      return network
    }))
  })

  return (
    <MainLayout>
      {/* Hero */}
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <div class="mb-8 border-b border-gray-700 pb-8">
          <div class="text-xs font-mono text-cyan-400 mb-2 uppercase">
            {siteData.company.tagline}
          </div>
          <h1 class="text-3xl font-bold mb-4 text-cyan-400">
            {siteData.hero.title}
          </h1>
          <p class="text-gray-300">
            {siteData.hero.subtitle}
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-2 text-sm">
          <For each={siteData.hero.points}>
            {(point) => (
              <div class="flex items-start">
                <span class="text-cyan-500 mr-2">•</span>
                <span class="text-gray-300">{point}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      {/* Stats */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <div class="border border-gray-700 bg-gray-900 p-6">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Infrastructure</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <For each={Object.values(siteData.infrastructure)}>
              {(stat) => (
                <div>
                  <span class="text-cyan-400 font-mono font-bold">{stat.value}</span>
                  <span class="text-gray-400 ml-2">{stat.label}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Services */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <h2 class="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
          {siteData.sections.services}
        </h2>
        <div class="grid md:grid-cols-3 gap-4">
          <For each={siteData.services}>
            {(service) => <ServiceCard service={service} />}
          </For>
        </div>
      </section>

      {/* Networks */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <h2 class="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
          {siteData.sections.networks}
        </h2>
        <div class="grid md:grid-cols-3 gap-4">
          <For each={networks()}>
            {(network) => <NetworkCard network={network} />}
          </For>
        </div>
      </section>

      {/* Blog Preview */}
      <BlogPreview limit={3} />

      {/* Links & Contact */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <h2 class="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
          Links & Contact
        </h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="border border-gray-700 bg-gray-900 p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Get in Touch</h3>
            <div class="space-y-2 font-mono text-sm">
              <div>
                <span class="text-gray-400">email:</span>
                <a href={`mailto:${siteData.contact.email}`} class="text-cyan-400 hover:text-cyan-300 ml-2 underline">
                  {siteData.contact.email}
                </a>
              </div>
              <div>
                <span class="text-gray-400">irc:</span>
                <span class="text-gray-300 ml-2">
                  {siteData.contact.irc.server} {siteData.contact.irc.channel}
                </span>
              </div>
            </div>
          </div>

          <div class="border border-gray-700 bg-gray-900 p-4">
            <h3 class="text-cyan-400 font-bold mb-3">External Links</h3>
            <div class="space-y-2 font-mono text-sm">
              <div>
                <a
                  href="https://github.com/rotkonetworks"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >
                  [GitHub]
                </a>
                <span class="text-gray-400 ml-2">rotkonetworks</span>
              </div>
              <div>
                <a
                  href="https://www.linkedin.com/company/rotko-networks"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >
                  [LinkedIn]
                </a>
                <span class="text-gray-400 ml-2">rotko-networks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <div class="border border-gray-700 bg-gray-900 p-8 text-center">
          <h2 class="text-xl font-bold text-cyan-400 mb-2">
            {siteData.cta.title}
          </h2>
          <p class="text-gray-400 mb-4 text-sm">
            {siteData.cta.subtitle}
          </p>
          <a
            href="/contact"
            class="text-cyan-400 hover:text-cyan-300 underline"
          >
            [{siteData.cta.button}]
          </a>
        </div>
      </section>
    </MainLayout>
  )
}

export default HomePage