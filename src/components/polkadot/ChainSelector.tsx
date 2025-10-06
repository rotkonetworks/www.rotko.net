import { Component, For, Show } from 'solid-js'
import { usePolkadot } from '../../contexts/PolkadotProvider'
import type { ChainId, ChainConfig } from '../../types/polkadot'

interface ChainSelectorProps {
  chains: Record<ChainId, ChainConfig>
  onChainChange?: (chain: ChainId) => void
}

export const ChainSelector: Component<ChainSelectorProps> = (props) => {
  const polkadot = usePolkadot()

  const handleChainChange = (chain: ChainId) => {
    polkadot.setSelectedChain(chain)
    props.onChainChange?.(chain)

    // Auto-connect to new chain if not connected
    if (!polkadot.isConnected(chain)) {
      polkadot.connectToChain(chain)
    }
  }

  return (
    <div class="flex gap-2 border-b border-gray-700 pb-2">
      <For each={Object.entries(props.chains) as [ChainId, ChainConfig][]}>
        {([chainId, config]) => (
          <button
            class={`px-4 py-2 text-sm transition-colors relative ${
              polkadot.selectedChain() === chainId
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleChainChange(chainId)}
            disabled={polkadot.isLoading()}
          >
            <span class="flex items-center gap-2">
              {config.name}
              <Show when={polkadot.isConnected(chainId)}>
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              </Show>
              <Show when={polkadot.isLoading() && polkadot.selectedChain() === chainId}>
                <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </Show>
            </span>
          </button>
        )}
      </For>
    </div>
  )
}