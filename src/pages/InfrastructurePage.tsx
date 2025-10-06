import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { infrastructureData } from '../data/infrastructure-data'
import InfrastructureStats from '../components/InfrastructureStats'
import RackDiagram from '../components/RackDiagram'

const InfrastructurePage: Component = () => {
  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400 mb-2">
            {infrastructureData.hero.title}
          </h1>
          <p class="text-gray-300">
            {infrastructureData.hero.subtitle}
          </p>
        </div>

        {/* Stats */}
        <InfrastructureStats />

        {/* Network Info */}
        <div class="mb-8 border border-gray-700 bg-gray-900 p-6">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">{infrastructureData.network.title}</h2>
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-400">ASN:</span>
              <span class="text-gray-300 ml-2">AS{infrastructureData.network.asn}</span>
            </div>
            <div>
              <span class="text-gray-400">Organization:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.network.organization}</span>
            </div>
            <div>
              <span class="text-gray-400">Primary Site:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.network.primarySite}</span>
            </div>
            <div>
              <span class="text-gray-400">Peering Policy:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.network.policy}</span>
            </div>
          </div>
          <div class="mt-4 flex gap-4">
            <a
              href={infrastructureData.network.peeringDb}
              target="_blank"
              rel="noopener noreferrer"
              class="text-cyan-400 hover:text-cyan-300 underline text-sm"
            >
              [PeeringDB]
            </a>
            <a
              href={infrastructureData.network.peeringInfo}
              target="_blank"
              rel="noopener noreferrer"
              class="text-cyan-400 hover:text-cyan-300 underline text-sm"
            >
              [Peering Info]
            </a>
          </div>
        </div>

        {/* Rack Diagram and Hardware Inventory Side by Side */}
        <div class="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Rack Diagram Box */}
          <div class="border border-gray-700 bg-gray-900 p-6">
            <RackDiagram />
          </div>

          {/* Hardware Inventory */}
          <div class="border border-gray-700 bg-gray-900 p-6">
            <h2 class="text-xl font-bold text-cyan-400 mb-4">{infrastructureData.hardware.title}</h2>

            <div class="space-y-4">
              <div>
                <h3 class="text-cyan-400 font-bold mb-2">Routers</h3>
                <div class="space-y-1 text-sm">
                  <For each={infrastructureData.hardware.routers}>
                    {(item) => (
                      <div class="text-gray-300">
                        <span class="text-gray-400">{item.count}x</span> {item.model} -
                        <span class="text-gray-400 ml-1">{item.role}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <h3 class="text-cyan-400 font-bold mb-2">Switches</h3>
                <div class="space-y-1 text-sm">
                  <For each={infrastructureData.hardware.switches}>
                    {(item) => (
                      <div class="text-gray-300">
                        <span class="text-gray-400">{item.count}x</span> {item.model} -
                        <span class="text-gray-400 ml-1">{item.role}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <h3 class="text-cyan-400 font-bold mb-2">Compute</h3>
                <div class="space-y-1 text-sm">
                  <For each={infrastructureData.hardware.compute}>
                    {(item) => (
                      <div class="text-gray-300">
                        <span class="text-gray-400">{item.count}x</span> {item.model} -
                        <span class="text-gray-400 ml-1">{item.role}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datacenter */}
        <div class="mb-8 border border-gray-700 bg-gray-900 p-6">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">{infrastructureData.datacenter.title}</h2>
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-400">Location:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.datacenter.location}</span>
            </div>
            <div>
              <span class="text-gray-400">Facility:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.datacenter.facility}</span>
            </div>
            <div>
              <span class="text-gray-400">Power:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.datacenter.power}</span>
            </div>
            <div>
              <span class="text-gray-400">Cooling:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.datacenter.cooling}</span>
            </div>
            <div>
              <span class="text-gray-400">Connectivity:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.datacenter.connectivity}</span>
            </div>
            <div>
              <span class="text-gray-400">Rack:</span>
              <span class="text-gray-300 ml-2">{infrastructureData.datacenter.rack}</span>
            </div>
          </div>
        </div>

        {/* Connectivity and Resilience Side by Side */}
        <div class="grid lg:grid-cols-2 gap-8">
          {/* Connectivity */}
          <div class="border border-gray-700 bg-gray-900 p-6">
            <h2 class="text-xl font-bold text-cyan-400 mb-4">{infrastructureData.connectivity.title}</h2>

            <div class="space-y-4">
              <div>
                <h3 class="text-cyan-400 font-bold mb-2">Transit</h3>
                <div class="space-y-1 text-sm">
                  <For each={infrastructureData.connectivity.transit}>
                    {(item) => (
                      <div class="text-gray-300">
                        {item.provider} - <span class="text-gray-400">{item.speed}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <h3 class="text-cyan-400 font-bold mb-2">Internet Exchanges</h3>
                <div class="space-y-1 text-sm">
                  <For each={infrastructureData.connectivity.exchanges}>
                    {(item) => (
                      <div class="text-gray-300">
                        {item.name} - <span class="text-gray-400">{item.speed}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>

          {/* Resilience */}
          <div class="border border-gray-700 bg-gray-900 p-6">
            <h2 class="text-xl font-bold text-cyan-400 mb-4">{infrastructureData.resilience.title}</h2>
            <div class="space-y-1 text-sm">
              <For each={infrastructureData.resilience.items}>
                {(item) => (
                  <div class="flex items-start text-gray-300">
                    <span class="i-mdi-check-circle text-cyan-400 mr-2 mt-0.5"></span>
                    {item}
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default InfrastructurePage