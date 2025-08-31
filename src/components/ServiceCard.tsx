import { Component, For, Show } from 'solid-js'
import { Service } from '../data/site-data'

interface ServiceCardProps {
  service: Service
}

const ServiceCard: Component<ServiceCardProps> = (props) => {
  const statusColors = {
    operational: 'bg-green-5',
    degraded: 'bg-yellow-5',
    maintenance: 'bg-red-5'
  }

  return (
    <div class="border border-gray-7 hover:border-cyan-3 transition-all p-6 bg-black/50">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-cyan-3">{props.service.name}</h3>
        <div class={`w-2 h-2 rounded-full ${statusColors[props.service.status]}`} />
      </div>

      <p class="text-gray-4 mb-4">{props.service.description}</p>

      <ul class="space-y-2 mb-4">
        <For each={props.service.features}>
          {(feature) => (
            <li class="flex items-center text-sm text-gray-3">
              <span class="w-1 h-1 bg-cyan-3 rounded-full mr-2" />
              {feature}
            </li>
          )}
        </For>
      </ul>

      <Show when={props.service.metrics}>
        <div class="pt-4 border-t border-gray-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-gray-5">24h Requests</div>
            <div class="text-cyan-3 font-bold">
              {(props.service.metrics!.requests24h / 1000000).toFixed(2)}M
            </div>
          </div>
          <div>
            <div class="text-gray-5">Latency</div>
            <div class="text-cyan-3 font-bold">{props.service.metrics!.latency}ms</div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default ServiceCard
