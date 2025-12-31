import { Component, For } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { servicesData, STAKING_NETWORKS, ENDPOINT_NETWORKS } from '../data/services-data'

const ServicesPage: Component = () => {
  const totalValidators = () => STAKING_NETWORKS.reduce((sum, n) => sum + n.validators, 0)

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400 mb-2">
            {servicesData.hero.title}
          </h1>
          <p class="text-gray-300">
            {servicesData.hero.subtitle}
          </p>
        </div>

        {/* Staking Services */}
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-cyan-400">Staking Services</h2>
            <span class="text-sm text-gray-500">{totalValidators()} validators</span>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            <For each={STAKING_NETWORKS}>
              {(network) => (
                <A
                  href={`/services/staking/${network.id}`}
                  class="block p-6 bg-gray-900 border border-gray-700 hover:border-cyan-600 rounded-lg transition-colors group"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {network.name}
                    </h3>
                    <span class="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                      {network.token}
                    </span>
                  </div>
                  <div class="text-sm text-gray-400 mb-2">
                    {network.validators} validator{network.validators !== 1 ? 's' : ''}
                  </div>
                  <div class="text-xs text-cyan-400 group-hover:text-cyan-300">
                    View details →
                  </div>
                </A>
              )}
            </For>
          </div>
        </div>

        {/* RPC Endpoints */}
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-cyan-400">RPC Endpoints</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            <For each={ENDPOINT_NETWORKS}>
              {(network) => (
                <A
                  href={`/services/endpoints/${network.id}`}
                  class="block p-6 bg-gray-900 border border-gray-700 hover:border-cyan-600 rounded-lg transition-colors group"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {network.name}
                    </h3>
                    <span class="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                      WSS
                    </span>
                  </div>
                  <div class="text-sm text-gray-400 mb-2">
                    {network.description}
                  </div>
                  <div class="text-xs text-cyan-400 group-hover:text-cyan-300">
                    View endpoints →
                  </div>
                </A>
              )}
            </For>
          </div>
        </div>

        {/* Other Services Grid */}
        <div class="mb-12">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Other Services</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={servicesData.services.filter(s =>
              s.title !== 'Staking Services' && s.title !== 'RPC Endpoints'
            )}>
              {(service) => (
                <div class="border border-gray-700 p-6 bg-gray-900 h-full flex flex-col">
                  <div class="flex items-center gap-3 mb-4">
                    <div class={`${service.iconClass} text-2xl text-cyan-400`}></div>
                    <h3 class="text-lg font-bold text-cyan-400">{service.title}</h3>
                  </div>
                  <p class="text-gray-400 text-sm mb-4">{service.description}</p>
                  <ul class="text-sm space-y-1 flex-1">
                    <For each={service.features.slice(0, 4)}>
                      {(feature) => (
                        <li class="text-gray-300 flex items-start">
                          <span class="text-cyan-500 mr-2">•</span>
                          {feature}
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Network Support */}
        <div class="mb-12 border border-gray-700 p-6 bg-gray-900">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Supported Networks</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <For each={servicesData.networks}>
              {(network) => (
                <div class="text-gray-300">• {network}</div>
              )}
            </For>
          </div>
        </div>

        {/* Stats */}
        <div class="mb-12 border border-gray-700 p-6 bg-gray-900">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Service Metrics</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <For each={servicesData.stats}>
              {(stat) => (
                <div>
                  <span class="text-cyan-400 font-mono font-bold">{stat.value}</span>
                  <span class="text-gray-400 ml-2">{stat.label}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Contact */}
        <div class="border border-gray-700 p-6 bg-gray-900">
          <h2 class="text-xl font-bold text-cyan-400 mb-2">{servicesData.cta.title}</h2>
          <p class="text-gray-400 text-sm mb-4">{servicesData.cta.description}</p>
          <div class="flex gap-4">
            <a
              href={servicesData.cta.primaryButton.href}
              class="text-cyan-400 hover:text-cyan-300 underline"
            >
              {servicesData.cta.primaryButton.text}
            </a>
            <span class="text-gray-600">|</span>
            <a
              href={servicesData.cta.secondaryButton.href}
              target="_blank"
              rel="noopener noreferrer"
              class="text-cyan-400 hover:text-cyan-300 underline"
            >
              {servicesData.cta.secondaryButton.text}
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default ServicesPage
