import { Component, createSignal, createEffect, For, Show, createMemo } from 'solid-js'
import { multiChainServicePapi } from '../../services/multi-chain-service-papi'
import type { ChainConfig } from '../../types/polkadot'

export interface ValidatorEntry {
  address: string
  identity?: string
  commission: number
  totalStake: bigint
  ownStake: bigint
  nominatorCount: number
  isActive: boolean
  isOversubscribed: boolean
  isBlocked: boolean
}

interface ValidatorBrowserProps {
  config: ChainConfig
  selectedValidators: string[]
  onSelectionChange: (validators: string[]) => void
  maxSelections?: number
  showSelected?: boolean
}

export const ValidatorBrowser: Component<ValidatorBrowserProps> = (props) => {
  const [validators, setValidators] = createSignal<ValidatorEntry[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [searchTerm, setSearchTerm] = createSignal('')
  const [sortBy, setSortBy] = createSignal<'stake' | 'commission' | 'nominators'>('stake')
  const [filterActive, setFilterActive] = createSignal(true)

  const maxSelections = () => props.maxSelections || 16

  const formatBalance = (value: bigint): string => {
    const divisor = 10n ** BigInt(props.config.decimals)
    const whole = value / divisor
    return whole.toLocaleString()
  }

  // Load validators
  createEffect(async () => {
    setLoading(true)
    setError(null)

    try {
      const validatorList = await multiChainServicePapi.getValidators()
      setValidators(validatorList)
    } catch (err) {
      console.error('Failed to load validators:', err)
      setError(err instanceof Error ? err.message : 'Failed to load validators')
    } finally {
      setLoading(false)
    }
  })

  const filteredValidators = createMemo(() => {
    let list = validators()
    const search = searchTerm().toLowerCase()

    // Filter by search
    if (search) {
      list = list.filter(v =>
        v.address.toLowerCase().includes(search) ||
        v.identity?.toLowerCase().includes(search)
      )
    }

    // Filter active only
    if (filterActive()) {
      list = list.filter(v => v.isActive && !v.isBlocked)
    }

    // Sort
    const sort = sortBy()
    list = [...list].sort((a, b) => {
      if (sort === 'stake') return Number(b.totalStake - a.totalStake)
      if (sort === 'commission') return a.commission - b.commission
      if (sort === 'nominators') return a.nominatorCount - b.nominatorCount
      return 0
    })

    return list
  })

  const isSelected = (address: string) => props.selectedValidators.includes(address)

  const toggleValidator = (address: string) => {
    const current = [...props.selectedValidators]
    const index = current.indexOf(address)

    if (index >= 0) {
      current.splice(index, 1)
    } else if (current.length < maxSelections()) {
      current.push(address)
    }

    props.onSelectionChange(current)
  }

  const clearSelection = () => props.onSelectionChange([])

  return (
    <div class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-cyan-400">Select Validators</h3>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">
              {props.selectedValidators.length} / {maxSelections()} selected
            </span>
            <Show when={props.selectedValidators.length > 0}>
              <button
                onClick={clearSelection}
                class="text-xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            </Show>
          </div>
        </div>

        {/* Search and Filters */}
        <div class="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by address or identity..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class="flex-1 min-w-[200px] px-3 py-2 bg-black border border-gray-700 rounded text-sm focus:border-cyan-400 focus:outline-none"
          />
          <select
            value={sortBy()}
            onChange={(e) => setSortBy(e.currentTarget.value as any)}
            class="px-3 py-2 bg-black border border-gray-700 rounded text-sm"
          >
            <option value="stake">Sort: Stake</option>
            <option value="commission">Sort: Commission</option>
            <option value="nominators">Sort: Nominators</option>
          </select>
          <label class="flex items-center gap-2 px-3 py-2 bg-black border border-gray-700 rounded text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filterActive()}
              onChange={(e) => setFilterActive(e.currentTarget.checked)}
              class="accent-cyan-400"
            />
            Active only
          </label>
        </div>
      </div>

      {/* Selected Validators Preview */}
      <Show when={props.showSelected && props.selectedValidators.length > 0}>
        <div class="p-3 bg-cyan-900/20 border-b border-gray-800">
          <div class="text-xs text-cyan-400 mb-2">Selected validators:</div>
          <div class="flex flex-wrap gap-1">
            <For each={props.selectedValidators}>
              {(addr) => {
                const v = validators().find(x => x.address === addr)
                return (
                  <span
                    class="px-2 py-1 bg-cyan-900/40 border border-cyan-700 rounded text-xs font-mono cursor-pointer hover:bg-red-900/40 hover:border-red-700"
                    onClick={() => toggleValidator(addr)}
                    title="Click to remove"
                  >
                    {v?.identity || `${addr.slice(0,6)}...${addr.slice(-4)}`}
                  </span>
                )
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* Validator List */}
      <div class="max-h-96 overflow-y-auto">
        <Show when={loading()}>
          <div class="p-8 text-center text-gray-400">
            <div class="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
            Loading validators...
          </div>
        </Show>

        <Show when={error()}>
          <div class="p-4 text-red-400 text-center">{error()}</div>
        </Show>

        <Show when={!loading() && !error()}>
          <table class="w-full text-sm">
            <thead class="bg-gray-800 sticky top-0">
              <tr class="text-left text-gray-400 text-xs uppercase">
                <th class="p-3 w-8"></th>
                <th class="p-3">Validator</th>
                <th class="p-3 text-right">Total Stake</th>
                <th class="p-3 text-right">Commission</th>
                <th class="p-3 text-right hidden md:table-cell">Nominators</th>
                <th class="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredValidators()}>
                {(v) => (
                  <tr
                    class={`border-b border-gray-800 cursor-pointer transition-colors ${
                      isSelected(v.address)
                        ? 'bg-cyan-900/30 hover:bg-cyan-900/40'
                        : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => toggleValidator(v.address)}
                  >
                    <td class="p-3">
                      <div class={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected(v.address)
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-600'
                      }`}>
                        <Show when={isSelected(v.address)}>
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </Show>
                      </div>
                    </td>
                    <td class="p-3">
                      <div class="font-medium text-white">
                        {v.identity || 'Unknown'}
                      </div>
                      <div class="font-mono text-xs text-gray-500">
                        {v.address.slice(0, 8)}...{v.address.slice(-6)}
                      </div>
                    </td>
                    <td class="p-3 text-right font-mono">
                      <div class="text-white">{formatBalance(v.totalStake)}</div>
                      <div class="text-xs text-gray-500">{props.config.token}</div>
                    </td>
                    <td class="p-3 text-right">
                      <span class={v.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                        {v.commission.toFixed(1)}%
                      </span>
                    </td>
                    <td class="p-3 text-right hidden md:table-cell text-gray-400">
                      {v.nominatorCount}
                    </td>
                    <td class="p-3 text-center">
                      <Show when={v.isBlocked}>
                        <span class="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded">Blocked</span>
                      </Show>
                      <Show when={v.isOversubscribed}>
                        <span class="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded">Full</span>
                      </Show>
                      <Show when={v.isActive && !v.isBlocked && !v.isOversubscribed}>
                        <span class="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">Active</span>
                      </Show>
                      <Show when={!v.isActive && !v.isBlocked}>
                        <span class="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">Waiting</span>
                      </Show>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <Show when={filteredValidators().length === 0}>
            <div class="p-8 text-center text-gray-500">
              No validators found matching your criteria
            </div>
          </Show>
        </Show>
      </div>

      {/* Footer with count */}
      <div class="p-3 border-t border-gray-800 bg-gray-900/50 text-xs text-gray-500">
        Showing {filteredValidators().length} of {validators().length} validators
      </div>
    </div>
  )
}
