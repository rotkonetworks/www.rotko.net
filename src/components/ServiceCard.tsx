import { Component, For, Show } from 'solid-js'
import { Service } from '../data/site-data'

interface ServiceCardProps {
  service: Service
}

const ServiceCard: Component<ServiceCardProps> = (props) => {
  const statusColors = {
    operational: 'text-green-400',
    degraded: 'text-yellow-400',
    maintenance: 'text-red-400'
  }

  return (
    <div class="border border-gray-700 p-4 bg-gray-900">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-cyan-400 font-bold">{props.service.name}</h3>
        <span class={`${statusColors[props.service.status]} text-xs`}>
          [{props.service.status}]
        </span>
      </div>

      <p class="text-gray-400 text-sm mb-3">{props.service.description}</p>

      <ul class="text-sm space-y-1">
        <For each={props.service.features}>
          {(feature) => (
            <li class="text-gray-300">
              <span class="text-cyan-500 mr-1">•</span>
              {feature}
            </li>
          )}
        </For>
      </ul>

      <Show when={props.service.metrics}>
        <div class="mt-3 pt-3 border-t border-gray-700 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-400">Requests/24h:</span>
            <span class="text-cyan-400 font-mono">
              {(props.service.metrics!.requests24h / 1000000).toFixed(1)}M
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Latency:</span>
            <span class="text-cyan-400 font-mono">
              {props.service.metrics!.latency}ms
            </span>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default ServiceCard