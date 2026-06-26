import { Component, For } from 'solid-js'
import { Service } from '../data/site-data'

interface ServiceCardProps {
  service: Service
}

const ServiceCard: Component<ServiceCardProps> = (props) => {
  return (
    <div class="rounded-xl border border-gray-800 bg-gray-900/40 p-6 h-full">
      <h3 class="text-white font-semibold text-lg">{props.service.name}</h3>
      <p class="text-gray-400 text-sm mt-2 leading-relaxed">{props.service.description}</p>

      <ul class="mt-4 space-y-2">
        <For each={props.service.features}>
          {(feature) => (
            <li class="text-sm text-gray-300 flex items-start gap-2">
              <span class="i-mdi-check text-cyan-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

export default ServiceCard
