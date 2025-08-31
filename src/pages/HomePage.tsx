import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import NetworkCard from '../components/NetworkCard'
import ServiceCard from '../components/ServiceCard'
import { siteData } from '../data/site-data'

const HomePage: Component = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section class="py-20 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl md:text-7xl font-bold mb-6 text-cyan-3 font-mono">
            {siteData.company.name.toUpperCase()}
          </h1>
          <p class="text-2xl text-gray-3 mb-4">{siteData.company.tagline}</p>
          <p class="text-lg text-gray-5">{siteData.company.description}</p>
        </div>
      </section>

      {/* Infrastructure Stats */}
      <section class="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-8">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <For each={Object.values(siteData.infrastructure)}>
              {(stat) => (
                <div class="text-center">
                  <div class="text-4xl font-bold text-cyan-3 mb-2">{stat.value}</div>
                  <div class="text-sm text-gray-5 uppercase">{stat.label}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Services */}
      <section class="py-20 px-4 sm:px-6 lg:px-8">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-12 text-cyan-3">SERVICES</h2>
          <div class="grid md:grid-cols-2 gap-8">
            <For each={siteData.services}>
              {(service) => <ServiceCard service={service} />}
            </For>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-12 text-cyan-3">SUPPORTED NETWORKS</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <For each={siteData.networks}>
              {(network) => <NetworkCard network={network} />}
            </For>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default HomePage
