import { Component, For, Show } from 'solid-js'
import { Service } from '../data/site-data'

interface ServiceCardProps {
  service: Service
}

const ServiceCard: Component<ServiceCardProps> = (props) => {
  const statusColors = {
    operational: 'bg-green-400',
    degraded: 'bg-yellow-400',
    maintenance: 'bg-red-400'
  }

  return (
    <div class="border border-gray-800 hover:border-gray-600 transition-all p-8 bg-gray-900/30 h-full flex flex-col">
      <div class="flex justify-between items-start mb-6">
        <h3 class="text-xl font-bold text-white">{props.service.name}</h3>
        <div class={`w-2 h-2 rounded-full ${statusColors[props.service.status]}`} />
      </div>

      <p class="text-gray-400 mb-6 flex-grow">{props.service.description}</p>

      <ul class="space-y-3 mb-6">
        <For each={props.service.features}>
          {(feature) => (
            <li class="flex items-start text-sm text-gray-300">
              <span class="text-cyan-400 mr-3 mt-1">→</span>
              <span>{feature}</span>
            </li>
          )}
        </For>
      </ul>

      <Show when={props.service.metrics}>
        <div class="pt-6 border-t border-gray-800 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-gray-500 text-xs uppercase">24h Requests</div>
            <div class="text-white font-bold text-lg">
              {(props.service.metrics!.requests24h / 1000000).toFixed(1)}M
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-xs uppercase">Latency</div>
            <div class="text-white font-bold text-lg">
              {props.service.metrics!.latency}ms
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default ServiceCard
