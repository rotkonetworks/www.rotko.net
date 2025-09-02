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
            change24h: parseFloat(prices[network.coingeckoId].change24h.toFixed(2))
          }
        }
      }
      return network
    }))
  })

  return (
    <MainLayout>
      {/* Hero */}
      <section class="min-h-[90vh] md:min-h-[80vh] flex items-center px-4 sm:px-6 lg:px-8 py-20">
        <div class="max-w-6xl mx-auto w-full">
          <div class="mb-8 md:mb-12">
            <div class="text-xs font-mono text-cyan-400 mb-4 md:mb-6 tracking-wider uppercase">
              {siteData.company.tagline}
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 md:mb-8 text-white leading-tight">
              {siteData.hero.title}
            </h1>
            <p class="text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              {siteData.hero.subtitle}
            </p>
          </div>
          
          <div class="grid sm:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-4 mt-8 md:mt-16">
            <For each={siteData.hero.points}>
              {(point) => (
                <div class="flex items-center gap-3">
                  <span class="text-cyan-400 text-lg">•</span>
                  <span class="text-gray-300 text-sm sm:text-base">{point}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section class="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            <For each={Object.values(siteData.infrastructure)}>
              {(stat) => (
                <div>
                  <div class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 font-mono">
                    {stat.value}
                  </div>
                  <div class="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Services */}
      <section class="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold mb-8 md:mb-16 text-white">
            {siteData.sections.services}
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <For each={siteData.services}>
              {(service) => <ServiceCard service={service} />}
            </For>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section class="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold mb-8 md:mb-16 text-white">
            {siteData.sections.networks}
          </h2>
          <div class="grid md:grid-cols-3 gap-6 md:gap-8">
            <For each={networks()}>
              {(network) => <NetworkCard network={network} />}
            </For>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <BlogPreview limit={3} />

      {/* CTA */}
      <section class="py-20 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            {siteData.cta.title}
          </h2>
          <p class="text-gray-400 mb-8 md:mb-10 text-base md:text-lg">
            {siteData.cta.subtitle}
          </p>
          <a 
            href="/contact" 
            class="px-6 sm:px-8 py-3 sm:py-4 bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition-colors text-base sm:text-lg inline-block"
          >
            {siteData.cta.button}
          </a>
        </div>
      </section>
    </MainLayout>
  )
}

export default HomePage
