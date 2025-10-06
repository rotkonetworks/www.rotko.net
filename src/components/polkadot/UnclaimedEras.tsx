import { Component, Show, For, createSignal } from 'solid-js'
import { multiChainServicePapi } from '../../services/multi-chain-service-papi'
import type { InjectedAccountWithMeta } from '../../types/polkadot'

interface UnclaimedErasProps {
  unclaimedEras: number[]
  account: InjectedAccountWithMeta
  onClaimRewards?: (eras: number[]) => void
  isValidator?: boolean
  currentEra?: number
}

export const UnclaimedEras: Component<UnclaimedErasProps> = (props) => {
  const [selectedEras, setSelectedEras] = createSignal<Set<number>>(new Set())
  const [claiming, setClaiming] = createSignal(false)
  const [expanded, setExpanded] = createSignal(false)

  const toggleEra = (era: number) => {
    const current = selectedEras()
    if (current.has(era)) {
      current.delete(era)
    } else {
      current.add(era)
    }
    setSelectedEras(new Set(current))
  }

  const selectAll = () => {
    setSelectedEras(new Set(props.unclaimedEras))
  }

  const selectNone = () => {
    setSelectedEras(new Set())
  }

  const claimSelected = async () => {
    const selected = Array.from(selectedEras())
    if (selected.length === 0) return

    setClaiming(true)
    try {
      props.onClaimRewards?.(selected)
    } catch (error) {
      console.error('Failed to claim rewards:', error)
    } finally {
      setClaiming(false)
    }
  }

  const getEraAge = (era: number) => {
    if (!props.currentEra) return ''
    const age = props.currentEra - era
    if (age === 1) return '1 era ago'
    return `${age} eras ago`
  }

  return (
    <Show when={props.unclaimedEras.length > 0}>
      <div class="border border-orange-700 bg-orange-900/20 rounded p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h4 class="text-orange-400 font-semibold">
              Unclaimed Rewards ({props.unclaimedEras.length} eras)
            </h4>
          </div>
          <button
            onClick={() => setExpanded(!expanded())}
            class="text-orange-400 hover:text-orange-300 transition-colors"
          >
            <svg
              class={`w-4 h-4 transition-transform ${expanded() ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <Show when={!expanded()}>
          <div class="text-sm text-gray-400 mb-3">
            {props.isValidator ? 'Validator' : 'Nominator'} rewards available for {props.unclaimedEras.length} eras
          </div>
        </Show>

        <Show when={expanded()}>
          <div class="space-y-3">
            <div class="flex gap-2 flex-wrap">
              <button
                onClick={selectAll}
                class="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                class="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
              >
                Select None
              </button>
              <Show when={selectedEras().size > 0}>
                <button
                  onClick={claimSelected}
                  disabled={claiming()}
                  class="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm transition-colors"
                >
                  {claiming() ? 'Claiming...' : `Claim ${selectedEras().size} Era${selectedEras().size > 1 ? 's' : ''}`}
                </button>
              </Show>
            </div>

            <div class="max-h-48 overflow-y-auto space-y-1">
              <For each={props.unclaimedEras}>
                {(era) => (
                  <div
                    class={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      selectedEras().has(era)
                        ? 'border-orange-500 bg-orange-900/30'
                        : 'border-gray-700 bg-gray-900/50 hover:bg-gray-800'
                    }`}
                    onClick={() => toggleEra(era)}
                  >
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEras().has(era)}
                        onChange={() => toggleEra(era)}
                        class="rounded"
                      />
                      <div>
                        <div class="font-mono text-sm">Era {era}</div>
                        <div class="text-xs text-gray-400">{getEraAge(era)}</div>
                      </div>
                    </div>
                    <div class="text-xs text-orange-400">
                      Claimable
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={props.unclaimedEras.length > 10}>
              <div class="text-xs text-gray-500 text-center">
                Showing latest {Math.min(props.unclaimedEras.length, 20)} unclaimed eras
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </Show>
  )
}