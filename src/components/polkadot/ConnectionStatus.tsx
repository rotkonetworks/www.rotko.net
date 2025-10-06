import { Component, Show } from 'solid-js'
import { usePolkadot } from '../../contexts/PolkadotProvider'

interface ConnectionStatusProps {
  showBlockNumber?: boolean
  compact?: boolean
}

export const ConnectionStatus: Component<ConnectionStatusProps> = (props) => {
  const polkadot = usePolkadot()
  const chain = () => polkadot.selectedChain()

  if (props.compact) {
    return (
      <div class="flex items-center gap-2 text-xs">
        <div class={`w-2 h-2 rounded-full ${
          polkadot.isConnected() ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span class="text-gray-400">
          {chain().toUpperCase()}
          <Show when={props.showBlockNumber && polkadot.blockNumber()}>
            {' #'}{polkadot.blockNumber()}
          </Show>
        </span>
      </div>
    )
  }

  return (
    <div class="p-4 bg-gray-900 border border-gray-700 rounded">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class={`w-2 h-2 rounded-full animate-pulse ${
              polkadot.isConnected() ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span class="font-mono">{chain().toUpperCase()} RPC</span>
          </div>

          <Show when={polkadot.isConnected() && props.showBlockNumber}>
            <div class="text-gray-400">
              Block #{polkadot.blockNumber() || '...'}
            </div>
          </Show>

          <Show when={polkadot.isLoading()}>
            <div class="text-cyan-400 text-xs">Connecting...</div>
          </Show>
        </div>

        <Show when={!polkadot.isConnected() && !polkadot.isLoading()}>
          <button
            onClick={() => polkadot.connectToChain(chain())}
            class="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
          >
            Connect
          </button>
        </Show>
      </div>

      <Show when={polkadot.error()}>
        <div class="mt-2 text-xs text-red-400">
          {polkadot.error()}
        </div>
      </Show>
    </div>
  )
}