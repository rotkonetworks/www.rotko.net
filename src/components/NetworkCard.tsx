import { Component, Show } from 'solid-js'
import { Network } from '../data/site-data'

interface NetworkCardProps {
  network: Network
}

const NetworkCard: Component<NetworkCardProps> = (props) => {
  const typeColors = {
    mainnet: 'text-cyan-400 border-cyan-400',
    canary: 'text-yellow-400 border-yellow-400',
    testnet: 'text-green-400 border-green-400'
  }

  return (
    <div class="border border-gray-800 hover:border-gray-600 transition-all p-6 bg-gray-900/30">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-white">{props.network.name}</h3>
        <span class={`text-xs px-2 py-1 border ${typeColors[props.network.type]}`}>
          {props.network.type.toUpperCase()}
        </span>
      </div>
      
      <p class="text-gray-400 mb-4">{props.network.description}</p>

      <Show when={props.network.price}>
        <div class="mb-4">
          <div class="flex justify-between items-center">
            <span class="text-2xl font-bold text-white">
              ${props.network.price?.current.toFixed(2)}
            </span>
            <span class={props.network.price?.change24h! > 0 ? 'text-green-400' : 'text-red-400'}>
              {props.network.price?.change24h! > 0 ? '+' : ''}{props.network.price?.change24h}%
            </span>
          </div>
        </div>
      </Show>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">APY</span>
          <span class="text-cyan-400 font-bold">{props.network.stats.apy}%</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Uptime</span>
          <span class="text-green-400">{props.network.stats.uptime}%</span>
        </div>
        <Show when={props.network.stats.staked > 0}>
          <div class="flex justify-between">
            <span class="text-gray-500">Staked</span>
            <span class="text-white">{props.network.stats.staked}%</span>
          </div>
        </Show>
      </div>

      <button class="w-full mt-6 py-2 bg-cyan-400 text-black font-bold hover:bg-cyan-500 transition-colors">
        {props.network.type === 'testnet' ? 'START FREE' : 'STAKE NOW'}
      </button>
    </div>
  )
}

export default NetworkCard
