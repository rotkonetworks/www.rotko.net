import { Component, createSignal, createEffect, For, Show, onCleanup } from 'solid-js'
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import { ROTKO_VALIDATORS } from '../data/validator-data'
import { turboflakesService, type ValidatorGrade } from '../services/turboflakes-service'
import MainLayout from '../layouts/MainLayout'

interface ChainConfig {
  name: string
  relay: string
  assetHub: string
  ss58: number
  decimals: number
  token: string
}

const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    relay: 'wss://polkadot.dotters.network',
    assetHub: 'wss://asset-hub-polkadot.dotters.network',
    ss58: 0,
    decimals: 10,
    token: 'DOT'
  },
  kusama: {
    name: 'Kusama',
    relay: 'wss://kusama.dotters.network',
    assetHub: 'wss://asset-hub-kusama.dotters.network',
    ss58: 2,
    decimals: 12,
    token: 'KSM'
  },
  paseo: {
    name: 'Paseo',
    relay: 'wss://paseo.dotters.network',
    assetHub: 'wss://asset-hub-paseo.dotters.network',
    ss58: 0,
    decimals: 10,
    token: 'PAS'
  }
}

interface ValidatorStatus {
  address: string
  name: string
  chain: string
  isActive: boolean
  totalStake: bigint
  ownStake: bigint
  commission: number
  nominatorCount: number
  eraPoints: number
  isOversubscribed: boolean
  grade?: ValidatorGrade
}

interface ChainState {
  loading: boolean
  error: string | null
  currentEra: number | null
  eraProgress: number
  validators: ValidatorStatus[]
}

const ValidatorsPage: Component = () => {
  const [chainStates, setChainStates] = createSignal<Record<string, ChainState>>({})
  const [selectedChain, setSelectedChain] = createSignal<string | null>(null)
  const clients: Record<string, any> = {}

  const formatBalance = (value: bigint, decimals: number): string => {
    const divisor = 10n ** BigInt(decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 100n / divisor).toString().padStart(2, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  const loadChainValidators = async (chainId: string) => {
    const config = CHAINS[chainId]
    const rotkoValidators = ROTKO_VALIDATORS[chainId] || []

    if (rotkoValidators.length === 0) {
      setChainStates(prev => ({
        ...prev,
        [chainId]: { loading: false, error: null, currentEra: null, eraProgress: 0, validators: [] }
      }))
      return
    }

    setChainStates(prev => ({
      ...prev,
      [chainId]: { loading: true, error: null, currentEra: null, eraProgress: 0, validators: [] }
    }))

    try {
      // Connect to asset hub for staking data
      const client = createClient(getWsProvider(config.assetHub))
      clients[chainId] = client
      const api = await client.getUnsafeApi()

      // Get era info
      let currentEra = 0
      let eraProgress = 0
      try {
        const activeEra = await api.query.Staking.ActiveEra.getValue()
        if (activeEra) {
          currentEra = activeEra.index
        }
        const currentBlock = await api.query.System.Number.getValue()
        const epochIndex = await api.query.Babe?.EpochIndex?.getValue?.() || 0
        eraProgress = Math.min(100, (Number(epochIndex) % 6) / 6 * 100)
      } catch (e) {
        console.warn(`[${chainId}] Could not get era info:`, e)
      }

      // Get validator data
      const validators: ValidatorStatus[] = []
      const addresses = rotkoValidators.map(v => v.address)

      // Fetch turboflakes grades for polkadot/kusama
      let grades = new Map<string, ValidatorGrade>()
      if (chainId === 'polkadot' || chainId === 'kusama') {
        grades = await turboflakesService.getValidatorGrades(chainId, addresses)
      }

      // Get active validators set
      let activeSet = new Set<string>()
      try {
        const sessionValidators = await api.query.Session.Validators.getValue()
        if (sessionValidators) {
          activeSet = new Set(sessionValidators.map((v: any) => v.toString()))
        }
      } catch (e) {
        console.warn(`[${chainId}] Could not get active validators:`, e)
      }

      // Get era points
      let eraPointsMap = new Map<string, number>()
      try {
        if (currentEra > 0) {
          const eraRewardPoints = await api.query.Staking.ErasRewardPoints.getValue(currentEra)
          if (eraRewardPoints?.individual) {
            for (const [addr, points] of eraRewardPoints.individual) {
              eraPointsMap.set(addr.toString(), Number(points))
            }
          }
        }
      } catch (e) {
        console.warn(`[${chainId}] Could not get era points:`, e)
      }

      for (const rv of rotkoValidators) {
        const isActive = activeSet.has(rv.address)
        let totalStake = 0n
        let ownStake = 0n
        let commission = 0
        let nominatorCount = 0
        let isOversubscribed = false

        try {
          // Get validator prefs
          const prefs = await api.query.Staking.Validators.getValue(rv.address)
          if (prefs) {
            commission = Number(prefs.commission) / 10000000 // Perbill to %
          }

          // Get exposure for current era
          if (currentEra > 0) {
            const exposure = await api.query.Staking.ErasStakers.getValue(currentEra, rv.address)
            if (exposure) {
              totalStake = BigInt(exposure.total?.toString() || '0')
              ownStake = BigInt(exposure.own?.toString() || '0')
              nominatorCount = exposure.others?.length || 0
              isOversubscribed = nominatorCount >= 512
            }
          }
        } catch (e) {
          console.warn(`[${chainId}] Could not get validator data for ${rv.name}:`, e)
        }

        validators.push({
          address: rv.address,
          name: rv.name,
          chain: chainId,
          isActive,
          totalStake,
          ownStake,
          commission,
          nominatorCount,
          eraPoints: eraPointsMap.get(rv.address) || 0,
          isOversubscribed,
          grade: grades.get(rv.address)
        })
      }

      setChainStates(prev => ({
        ...prev,
        [chainId]: { loading: false, error: null, currentEra, eraProgress, validators }
      }))
    } catch (err) {
      console.error(`[${chainId}] Failed to load validators:`, err)
      setChainStates(prev => ({
        ...prev,
        [chainId]: {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load',
          currentEra: null,
          eraProgress: 0,
          validators: []
        }
      }))
    }
  }

  // Load all chains on mount
  createEffect(() => {
    for (const chainId of Object.keys(CHAINS)) {
      loadChainValidators(chainId)
    }
  })

  // Cleanup clients
  onCleanup(() => {
    for (const client of Object.values(clients)) {
      try {
        client?.destroy?.()
      } catch (e) {}
    }
  })

  const allValidators = () => {
    const all: ValidatorStatus[] = []
    for (const state of Object.values(chainStates())) {
      all.push(...state.validators)
    }
    return all
  }

  const totalActiveCount = () => allValidators().filter(v => v.isActive).length
  const totalCount = () => allValidators().length

  const filteredValidators = () => {
    const chain = selectedChain()
    if (!chain) return allValidators()
    return chainStates()[chain]?.validators || []
  }

  const isLoading = () => {
    return Object.values(chainStates()).some(s => s.loading)
  }

  return (
    <MainLayout>
      <div class="min-h-screen bg-black text-white">
        {/* Header */}
        <div class="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-black">
          <div class="max-w-6xl mx-auto px-4 py-12">
            <div class="flex items-center gap-4 mb-4">
              <img src="/rotko-icon.svg" alt="Rotko" class="w-12 h-12" />
              <div>
                <h1 class="text-3xl font-bold text-cyan-400">Rotko Validators</h1>
                <p class="text-gray-400">Live status across Polkadot ecosystem</p>
              </div>
            </div>

            {/* Summary Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div class="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div class="text-2xl font-bold text-white">{totalCount()}</div>
                <div class="text-sm text-gray-500">Total Validators</div>
              </div>
              <div class="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div class="text-2xl font-bold text-green-400">{totalActiveCount()}</div>
                <div class="text-sm text-gray-500">Active This Era</div>
              </div>
              <div class="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div class="text-2xl font-bold text-cyan-400">{Object.keys(CHAINS).length}</div>
                <div class="text-sm text-gray-500">Networks</div>
              </div>
              <div class="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div class="text-2xl font-bold text-purple-400">
                  {isLoading() ? '...' : '100%'}
                </div>
                <div class="text-sm text-gray-500">Uptime Target</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chain Filter */}
        <div class="border-b border-gray-800 bg-gray-900/30">
          <div class="max-w-6xl mx-auto px-4 py-4">
            <div class="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedChain(null)}
                class={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedChain() === null
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All Networks
              </button>
              <For each={Object.entries(CHAINS)}>
                {([chainId, config]) => (
                  <button
                    onClick={() => setSelectedChain(chainId)}
                    class={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      selectedChain() === chainId
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {config.name}
                    <span class="ml-2 text-xs opacity-60">
                      ({ROTKO_VALIDATORS[chainId]?.length || 0})
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Validators Grid */}
        <div class="max-w-6xl mx-auto px-4 py-8">
          {/* Loading State */}
          <Show when={isLoading() && filteredValidators().length === 0}>
            <div class="text-center py-12">
              <div class="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p class="text-gray-400">Connecting to networks...</p>
            </div>
          </Show>

          {/* Validators */}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <For each={filteredValidators()}>
              {(validator) => {
                const config = CHAINS[validator.chain]
                return (
                  <div class={`rounded-lg border p-4 transition-all ${
                    validator.isActive
                      ? 'bg-green-900/10 border-green-800/50'
                      : 'bg-gray-900/50 border-gray-800'
                  }`}>
                    {/* Header */}
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <div class="font-semibold text-white">{validator.name}</div>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                            {config.name}
                          </span>
                          <a
                            href={`https://${validator.chain}.subscan.io/account/${validator.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="font-mono text-xs text-gray-500 hover:text-cyan-400"
                          >
                            {validator.address.slice(0, 6)}...{validator.address.slice(-4)}
                          </a>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        {/* Turboflakes Grade */}
                        <Show when={validator.grade}>
                          <div
                            class={`px-2 py-1 rounded text-xs font-bold ${
                              turboflakesService.getGradeBgColor(validator.grade!.grade)
                            } ${turboflakesService.getGradeColor(validator.grade!.grade)}`}
                            title={`MVR: ${(validator.grade!.mvr * 100).toFixed(2)}% | BAR: ${(validator.grade!.bar * 100).toFixed(2)}%`}
                          >
                            {validator.grade!.grade}
                          </div>
                        </Show>
                        <span class={`px-2 py-1 text-xs rounded ${
                          validator.isActive
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}>
                          {validator.isActive ? 'Active' : 'Waiting'}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div class="text-gray-500 text-xs">Total Stake</div>
                        <div class="font-mono text-cyan-400">
                          {formatBalance(validator.totalStake, config.decimals)} {config.token}
                        </div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-xs">Self Stake</div>
                        <div class="font-mono text-white">
                          {formatBalance(validator.ownStake, config.decimals)} {config.token}
                        </div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-xs">Commission</div>
                        <div class={validator.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                          {validator.commission.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-xs">Nominators</div>
                        <div class={validator.isOversubscribed ? 'text-red-400' : 'text-white'}>
                          {validator.nominatorCount}
                          {validator.isOversubscribed && ' (full)'}
                        </div>
                      </div>
                      <Show when={validator.eraPoints > 0}>
                        <div class="col-span-2">
                          <div class="text-gray-500 text-xs">Era Points</div>
                          <div class="text-purple-400 font-mono">{validator.eraPoints.toLocaleString()}</div>
                        </div>
                      </Show>
                    </div>

                    {/* Performance Metrics */}
                    <Show when={validator.grade}>
                      <div class="mt-3 pt-3 border-t border-gray-800">
                        <div class="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span class="text-gray-500">MVR:</span>
                            <span class={`ml-1 ${validator.grade!.mvr < 0.05 ? 'text-green-400' : validator.grade!.mvr < 0.1 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {(validator.grade!.mvr * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500">BAR:</span>
                            <span class={`ml-1 ${validator.grade!.bar > 0.98 ? 'text-green-400' : validator.grade!.bar > 0.95 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {(validator.grade!.bar * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>

          {/* Chain Era Info */}
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            <For each={Object.entries(CHAINS)}>
              {([chainId, config]) => {
                const state = () => chainStates()[chainId]
                return (
                  <div class="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-medium text-white">{config.name}</span>
                      <Show when={state()?.loading}>
                        <div class="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                      </Show>
                    </div>
                    <Show when={state()?.currentEra}>
                      <div class="text-sm text-gray-400">Era {state()!.currentEra}</div>
                      <div class="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                        <div
                          class="h-full bg-cyan-500 transition-all"
                          style={`width: ${state()!.eraProgress}%`}
                        />
                      </div>
                    </Show>
                    <Show when={state()?.error}>
                      <div class="text-xs text-red-400 mt-1">{state()!.error}</div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </div>

        {/* Footer Info */}
        <div class="border-t border-gray-800 bg-gray-900/30">
          <div class="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            <p>Data refreshed on page load. Grades from <a href="https://turboflakes.io" target="_blank" class="text-cyan-400 hover:underline">Turboflakes ONE-T</a> (Polkadot/Kusama only).</p>
            <p class="mt-1">MVR = Missed Votes Ratio | BAR = Bitfield Availability Ratio</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ValidatorsPage
