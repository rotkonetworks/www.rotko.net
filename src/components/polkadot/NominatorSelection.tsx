import { Component, createSignal, createEffect, For, Show, createMemo } from 'solid-js'
import { multiChainServicePapi, type ValidatorEntry } from '../../services/multi-chain-service-papi'
import { turboflakesService, type ValidatorGrade } from '../../services/turboflakes-service'
import { ROTKO_VALIDATORS } from '../../data/validator-data'
import type { ChainId, ChainConfig } from '../../types/polkadot'

interface NominatorSelectionProps {
  chainId: ChainId
  config: ChainConfig
  maxSelections?: number
  initialSelected?: string[]
  onSelectionChange: (validators: string[]) => void
  onClose?: () => void
}

export const NominatorSelection: Component<NominatorSelectionProps> = (props) => {
  const [validators, setValidators] = createSignal<ValidatorEntry[]>([])
  const [loading, setLoading] = createSignal(true)
  const [loadingGrades, setLoadingGrades] = createSignal(false)
  const [grades, setGrades] = createSignal<Map<string, ValidatorGrade>>(new Map())
  const [selected, setSelected] = createSignal<Set<string>>(new Set(props.initialSelected || []))
  const [searchTerm, setSearchTerm] = createSignal('')
  const [sortBy, setSortBy] = createSignal<'recommended' | 'commission' | 'stake' | 'nominators' | 'grade'>('recommended')
  const [showOnlyActive, setShowOnlyActive] = createSignal(true)

  const maxSelections = props.maxSelections || 16

  // Check if Turboflakes is available for this network
  const hasTurboflakes = () => props.chainId === 'polkadot' || props.chainId === 'kusama'

  const formatBalance = (value: bigint): string => {
    const divisor = 10n ** BigInt(props.config.decimals)
    const whole = value / divisor
    if (whole > 1000000n) return `${(Number(whole) / 1000000).toFixed(1)}M`
    if (whole > 1000n) return `${(Number(whole) / 1000).toFixed(1)}K`
    return whole.toLocaleString()
  }

  // Load validators on mount
  createEffect(async () => {
    setLoading(true)
    try {
      const allValidators = await multiChainServicePapi.getValidators()
      setValidators(allValidators)

      // Fetch Turboflakes grades for active validators (Polkadot/Kusama only)
      if (hasTurboflakes()) {
        setLoadingGrades(true)
        const activeAddresses = allValidators
          .filter(v => v.isActive)
          .slice(0, 100) // Limit to avoid too many requests
          .map(v => v.address)

        const validatorGrades = await turboflakesService.getValidatorGrades(
          props.chainId,
          activeAddresses
        )
        setGrades(validatorGrades)
        setLoadingGrades(false)
      }
    } catch (err) {
      console.error('Failed to load validators:', err)
    } finally {
      setLoading(false)
      setLoadingGrades(false)
    }
  })

  // Get Rotko validator addresses for this chain
  const rotkoAddresses = createMemo(() => {
    const rotko = ROTKO_VALIDATORS[props.chainId] || []
    return new Set(rotko.map(v => v.address))
  })

  const rotkoValidatorInfo = createMemo(() => {
    return ROTKO_VALIDATORS[props.chainId] || []
  })

  // Separate Rotko validators from others
  const rotkoValidators = createMemo(() => {
    const rotkoSet = rotkoAddresses()
    return validators().filter(v => rotkoSet.has(v.address))
  })

  // Calculate score incorporating Turboflakes grade
  const estimateScore = (v: ValidatorEntry): number => {
    let score = 100
    const grade = grades().get(v.address)

    // If we have Turboflakes grade, weight it heavily
    if (grade) {
      // Grade contributes 40% of score (A+ = 45 points, F = 0)
      score = grade.gradeNumeric * 10

      // Low MVR bonus (good performance)
      if (grade.mvr < 0.05) score += 20
      else if (grade.mvr < 0.10) score += 10
      else if (grade.mvr > 0.20) score -= 20

      // High BAR bonus (availability)
      if (grade.bar > 0.98) score += 10
      else if (grade.bar < 0.90) score -= 10
    }

    // Lower commission = higher score
    score -= v.commission * 2

    // Active validators get bonus
    if (v.isActive) score += 15

    // Oversubscribed = lower score (harder to get rewards)
    if (v.isOversubscribed) score -= 25

    // Has identity = more trustworthy
    if (v.identity) score += 5

    // Blocked = unusable
    if (v.isBlocked) score = 0

    return Math.max(0, Math.min(100, score))
  }

  // Get grade for a validator
  const getGrade = (address: string) => grades().get(address)

  // Sort and filter validators
  const sortedValidators = createMemo(() => {
    const rotkoSet = rotkoAddresses()
    let filtered = validators().filter(v => !rotkoSet.has(v.address))

    // Apply search filter
    const search = searchTerm().toLowerCase()
    if (search) {
      filtered = filtered.filter(v =>
        v.address.toLowerCase().includes(search) ||
        v.identity?.toLowerCase().includes(search)
      )
    }

    // Filter active only
    if (showOnlyActive()) {
      filtered = filtered.filter(v => v.isActive && !v.isBlocked)
    }

    // Sort
    switch (sortBy()) {
      case 'recommended':
        filtered.sort((a, b) => estimateScore(b) - estimateScore(a))
        break
      case 'grade':
        filtered.sort((a, b) => {
          const gradeA = grades().get(a.address)?.gradeNumeric || 0
          const gradeB = grades().get(b.address)?.gradeNumeric || 0
          return gradeB - gradeA
        })
        break
      case 'commission':
        filtered.sort((a, b) => a.commission - b.commission)
        break
      case 'stake':
        filtered.sort((a, b) => Number(b.totalStake - a.totalStake))
        break
      case 'nominators':
        filtered.sort((a, b) => a.nominatorCount - b.nominatorCount)
        break
    }

    return filtered
  })

  const toggleValidator = (address: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(address)) {
        next.delete(address)
      } else if (next.size < maxSelections) {
        next.add(address)
      }
      props.onSelectionChange(Array.from(next))
      return next
    })
  }

  const selectAllRotko = () => {
    setSelected(prev => {
      const next = new Set(prev)
      const rotko = rotkoValidatorInfo()
      for (const v of rotko) {
        if (next.size < maxSelections) {
          next.add(v.address)
        }
      }
      props.onSelectionChange(Array.from(next))
      return next
    })
  }

  const selectRecommended = () => {
    // Select Rotko + top recommended validators up to max
    const rotko = rotkoValidatorInfo()
    const recommended = sortedValidators().slice(0, maxSelections - rotko.length)

    const newSelection = new Set<string>()
    for (const v of rotko) {
      newSelection.add(v.address)
    }
    for (const v of recommended) {
      if (newSelection.size < maxSelections) {
        newSelection.add(v.address)
      }
    }

    setSelected(newSelection)
    props.onSelectionChange(Array.from(newSelection))
  }

  const clearSelection = () => {
    setSelected(new Set())
    props.onSelectionChange([])
  }

  const rotkoSelectedCount = createMemo(() => {
    const rotkoSet = rotkoAddresses()
    return Array.from(selected()).filter(a => rotkoSet.has(a)).length
  })

  return (
    <div class="bg-gray-900 rounded-lg overflow-hidden max-h-[80vh] flex flex-col">
      {/* Header */}
      <div class="p-4 border-b border-gray-800 bg-gray-800/50">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-white text-lg">Select Validators to Nominate</h3>
          <div class="text-sm">
            <span class={selected().size >= maxSelections ? 'text-yellow-400' : 'text-cyan-400'}>
              {selected().size}
            </span>
            <span class="text-gray-500">/{maxSelections}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="flex flex-wrap gap-2">
          <button
            onClick={selectAllRotko}
            class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm text-white"
          >
            + Rotko Validators ({rotkoValidatorInfo().length})
          </button>
          <button
            onClick={selectRecommended}
            class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm text-white"
          >
            Auto-Select Best {maxSelections}
          </button>
          <Show when={selected().size > 0}>
            <button
              onClick={clearSelection}
              class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
            >
              Clear All
            </button>
          </Show>
        </div>
      </div>

      {/* Phragmen Tip */}
      <div class="px-4 py-2 bg-blue-900/20 border-b border-blue-800/30 text-xs text-blue-300">
        <strong>Tip:</strong> Nominate multiple validators (up to 16). The Phragmen algorithm distributes your stake to optimize rewards. Even if some validators are full, you may still earn through others.
      </div>

      {/* Rotko Validators Section */}
      <Show when={rotkoValidatorInfo().length > 0}>
        <div class="p-4 border-b border-gray-800 bg-gradient-to-r from-cyan-900/20 to-transparent">
          <div class="flex items-center gap-2 mb-3">
            <img src="/rotko-icon.svg" alt="Rotko" class="w-5 h-5" />
            <span class="font-semibold text-cyan-400">Rotko Validators</span>
            <span class="text-xs text-gray-500">
              ({rotkoSelectedCount()}/{rotkoValidatorInfo().length} selected)
            </span>
          </div>

          <div class="grid gap-2">
            <For each={rotkoValidatorInfo()}>
              {(rotkoInfo) => {
                const chainData = () => rotkoValidators().find(v => v.address === rotkoInfo.address)
                const isSelected = () => selected().has(rotkoInfo.address)

                return (
                  <div
                    onClick={() => toggleValidator(rotkoInfo.address)}
                    class={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected()
                        ? 'bg-cyan-900/30 border-cyan-600'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected() ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'
                        }`}>
                          <Show when={isSelected()}>
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </Show>
                        </div>
                        <div>
                          <div class="font-medium text-white">{rotkoInfo.name}</div>
                          <div class="font-mono text-xs text-gray-500">
                            {rotkoInfo.address.slice(0, 8)}...{rotkoInfo.address.slice(-6)}
                          </div>
                        </div>
                      </div>

                      <Show when={chainData()}>
                        <div class="flex items-center gap-4 text-xs">
                          {/* Grade badge for Rotko validators (historical) */}
                          <Show when={getGrade(rotkoInfo.address)}>
                            {(grade) => (
                              <div
                                class={`px-2 py-0.5 rounded font-bold text-center w-10 ${turboflakesService.getGradeBgColor(grade().grade)} ${turboflakesService.getGradeColor(grade().grade)}`}
                                title={`${grade().sessionsCount} sessions | MVR: ${(grade().mvr * 100).toFixed(1)}% | BAR: ${(grade().bar * 100).toFixed(1)}%`}
                              >
                                {grade().grade}
                              </div>
                            )}
                          </Show>
                          <div class="text-right">
                            <div class="text-gray-500">Commission</div>
                            <div class={chainData()!.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                              {chainData()!.commission.toFixed(1)}%
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="text-gray-500">Nominators</div>
                            <div class={chainData()!.isOversubscribed ? 'text-red-400' : 'text-white'}>
                              {chainData()!.nominatorCount}
                            </div>
                          </div>
                          <span class={`px-2 py-1 rounded text-xs ${
                            chainData()!.isActive
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {chainData()!.isActive ? 'Active' : 'Waiting'}
                          </span>
                        </div>
                      </Show>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* Search and Filters */}
      <div class="p-4 border-b border-gray-800 space-y-3">
        <input
          type="text"
          placeholder="Search by address or identity..."
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm focus:border-cyan-400 focus:outline-none"
        />

        <div class="flex flex-wrap items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-500">Sort:</span>
            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="recommended">Recommended</option>
              <Show when={hasTurboflakes()}>
                <option value="grade">Highest Grade</option>
              </Show>
              <option value="commission">Lowest Commission</option>
              <option value="stake">Highest Stake</option>
              <option value="nominators">Fewest Nominators</option>
            </select>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyActive()}
              onChange={(e) => setShowOnlyActive(e.currentTarget.checked)}
              class="accent-cyan-500"
            />
            <span class="text-gray-400">Active only</span>
          </label>

          <span class="text-gray-600 text-xs">
            {sortedValidators().length} validators
          </span>
        </div>
      </div>

      {/* Loading */}
      <Show when={loading()}>
        <div class="p-8 text-center">
          <div class="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
          <span class="text-sm text-gray-400">Loading validators...</span>
        </div>
      </Show>

      {/* Validator List */}
      <Show when={!loading()}>
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <For each={sortedValidators().slice(0, 100)}>
            {(validator) => {
              const isSelected = () => selected().has(validator.address)
              const score = estimateScore(validator)

              return (
                <div
                  onClick={() => toggleValidator(validator.address)}
                  class={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected()
                      ? 'bg-purple-900/30 border-purple-600'
                      : validator.isOversubscribed
                        ? 'bg-gray-800/30 border-gray-700 hover:border-gray-600 opacity-70'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected() ? 'bg-purple-500 border-purple-500' : 'border-gray-600'
                      }`}>
                        <Show when={isSelected()}>
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </Show>
                      </div>
                      <div class="min-w-0">
                        <div class="font-medium text-white truncate">
                          {validator.identity || validator.address.slice(0, 12) + '...'}
                        </div>
                        <div class="font-mono text-xs text-gray-500">
                          {validator.address.slice(0, 8)}...{validator.address.slice(-6)}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 text-xs flex-shrink-0">
                      {/* Grade badge from Turboflakes (historical ~2 weeks) */}
                      <Show when={getGrade(validator.address)} fallback={
                        <Show when={hasTurboflakes() && loadingGrades()}>
                          <div class="w-10 text-center">
                            <div class="animate-pulse bg-gray-700 h-5 rounded" />
                          </div>
                        </Show>
                      }>
                        {(grade) => (
                          <div
                            class={`px-2 py-0.5 rounded font-bold text-center w-10 ${turboflakesService.getGradeBgColor(grade().grade)} ${turboflakesService.getGradeColor(grade().grade)}`}
                            title={`${grade().sessionsCount} sessions | MVR: ${(grade().mvr * 100).toFixed(1)}% | BAR: ${(grade().bar * 100).toFixed(1)}%`}
                          >
                            {grade().grade}
                          </div>
                        )}
                      </Show>

                      {/* Score indicator */}
                      <div class="hidden sm:block w-10">
                        <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            class={`h-full ${score > 70 ? 'bg-green-500' : score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={`width: ${score}%`}
                          />
                        </div>
                      </div>

                      <div class="text-right w-12">
                        <div class="text-gray-500">Comm.</div>
                        <div class={validator.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                          {validator.commission.toFixed(1)}%
                        </div>
                      </div>

                      <div class="text-right w-14 hidden sm:block">
                        <div class="text-gray-500">Stake</div>
                        <div class="text-white">{formatBalance(validator.totalStake)}</div>
                      </div>

                      <div class="text-right w-10">
                        <div class="text-gray-500">Noms</div>
                        <div class={validator.isOversubscribed ? 'text-red-400' : 'text-white'}>
                          {validator.nominatorCount}
                        </div>
                      </div>

                      <span class={`px-1.5 py-1 rounded w-14 text-center ${
                        validator.isActive
                          ? 'bg-green-900/50 text-green-400'
                          : validator.isBlocked
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-gray-800 text-gray-400'
                      }`}>
                        {validator.isActive ? 'Active' : validator.isBlocked ? 'Blocked' : 'Wait'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }}
          </For>

          <Show when={sortedValidators().length > 100}>
            <div class="text-center text-gray-500 text-sm py-4">
              Showing first 100 validators. Use search to find more.
            </div>
          </Show>
        </div>
      </Show>

      {/* Footer with Selection Summary */}
      <div class="p-4 border-t border-gray-800 bg-gray-800/50">
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <Show when={selected().size > 0}>
              <span class="text-gray-400">Selected: </span>
              <span class="text-cyan-400">{rotkoSelectedCount()} Rotko</span>
              <Show when={selected().size - rotkoSelectedCount() > 0}>
                <span class="text-gray-400"> + </span>
                <span class="text-purple-400">{selected().size - rotkoSelectedCount()} others</span>
              </Show>
            </Show>
            <Show when={selected().size === 0}>
              <span class="text-gray-500">No validators selected</span>
            </Show>
          </div>

          <div class="flex gap-2">
            <Show when={props.onClose}>
              <button
                onClick={props.onClose}
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
              >
                Cancel
              </button>
            </Show>
            <button
              onClick={() => props.onSelectionChange(Array.from(selected()))}
              disabled={selected().size === 0}
              class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-white text-sm"
            >
              Confirm Selection ({selected().size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
