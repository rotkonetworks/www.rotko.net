import { Component, Show } from 'solid-js'
import { Network } from '../data/site-data'

interface NetworkCardProps {
  network: Network
}

const NetworkCard: Component<NetworkCardProps> = (props) => {
  const typeColors = {
    mainnet: 'text-cyan-400',
    canary: 'text-yellow-400',
    testnet: 'text-green-400'
  }

  const networkLinks: Record<string, { url: string; label: string }> = {
    polkadot: { url: '/services/staking/polkadot', label: 'Stake Now' },
    kusama: { url: '/services/staking/kusama', label: 'Stake Now' },
    penumbra: { url: '/services/staking/penumbra', label: 'Stake Now' },
    paseo: { url: '/services/staking/paseo', label: 'View Validators' }
  }

  const isStaking = props.network.stats.apy > 0 || props.network.stats.staked > 0

  return (
    <div class="border border-gray-700 p-4 bg-gray-900">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-cyan-400 font-bold">{props.network.name}</h3>
        <span class={`text-xs ${typeColors[props.network.type]}`}>
          [{props.network.type}]
        </span>
      </div>

      <p class="text-gray-400 text-sm mb-3">{props.network.description}</p>

      <Show when={props.network.price}>
        <div class="mb-3 text-sm">
          <span class="text-gray-400">Price: </span>
          <span class="text-white font-mono">
            ${props.network.price?.current.toFixed(2)}
          </span>
          <span class={`ml-2 text-xs ${props.network.price?.change30d! > 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({props.network.price?.change30d! > 0 ? '+' : ''}{props.network.price?.change30d.toFixed(1)}% 30d)
          </span>
        </div>
      </Show>

      <div class="space-y-1 text-xs border-t border-gray-700 pt-3">
        <Show when={isStaking}>
          <div class="flex justify-between">
            <span class="text-gray-400">APY:</span>
            <span class="text-cyan-400 font-mono">{props.network.stats.apy}%</span>
          </div>
        </Show>
        <div class="flex justify-between">
          <span class="text-gray-400">Uptime:</span>
          <span class="text-green-400 font-mono">{props.network.stats.uptime}%</span>
        </div>
        <Show when={props.network.stats.staked > 0}>
          <div class="flex justify-between">
            <span class="text-gray-400">Staked:</span>
            <span class="text-gray-300 font-mono">{props.network.stats.staked}%</span>
          </div>
        </Show>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-700">
        <a
          href={networkLinks[props.network.id]?.url || '/services'}
          class="text-cyan-400 hover:text-cyan-300 underline text-sm"
        >
          [{networkLinks[props.network.id]?.label || 'Learn More'}]
        </a>
      </div>
    </div>
  )
}

export default NetworkCard