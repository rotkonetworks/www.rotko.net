import { Component, Show } from 'solid-js'
import { Network } from '../data/site-data'

interface NetworkCardProps {
  network: Network
}

const NetworkCard: Component<NetworkCardProps> = (props) => {
  const typeColors = {
    mainnet: 'text-cyan-3 border-cyan-3',
    canary: 'text-yellow-4 border-yellow-4',
    testnet: 'text-green-4 border-green-4'
  }

  return (
    <div class="border border-gray-7 hover:border-cyan-3 transition-all p-6 bg-black/50">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-white">{props.network.name}</h3>
        <span class={`text-xs px-2 py-1 border ${typeColors[props.network.type]}`}>
          {props.network.type.toUpperCase()}
        </span>
      </div>
      
      <p class="text-gray-4 mb-4">{props.network.description}</p>

      <Show when={props.network.price}>
        <div class="mb-4">
          <div class="flex justify-between items-center">
            <span class="text-2xl font-bold text-white">
              ${props.network.price?.current.toFixed(2)}
            </span>
            <span class={props.network.price?.change24h! > 0 ? 'text-green-4' : 'text-red-4'}>
              {props.network.price?.change24h! > 0 ? '+' : ''}{props.network.price?.change24h}%
            </span>
          </div>
        </div>
      </Show>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-5">APY</span>
          <span class="text-cyan-3 font-bold">{props.network.stats.apy}%</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-5">Uptime</span>
          <span class="text-green-4">{props.network.stats.uptime}%</span>
        </div>
        <Show when={props.network.stats.staked > 0}>
          <div class="flex justify-between">
            <span class="text-gray-5">Staked</span>
            <span class="text-white">{props.network.stats.staked}%</span>
          </div>
        </Show>
      </div>

      <button class="w-full mt-6 py-2 border border-cyan-3 text-cyan-3 hover:bg-cyan-3 hover:text-black transition-all">
        {props.network.type === 'testnet' ? 'START FREE' : 'STAKE NOW'}
      </button>
    </div>
  )
}

export default NetworkCard
