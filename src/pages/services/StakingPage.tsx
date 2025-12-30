import { Component, createSignal, createEffect, For, Show, onCleanup } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import MainLayout from '../../layouts/MainLayout'
import { ROTKO_VALIDATORS } from '../../data/validator-data'
import { turboflakesService, type ValidatorGrade } from '../../services/turboflakes-service'

interface ChainConfig {
  name: string
  assetHub: string
  relay: string
  ss58: number
  decimals: number
  token: string
  subscan: string
  color: string
}

const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    assetHub: 'wss://asset-hub-polkadot.dotters.network',
    relay: 'wss://polkadot.dotters.network',
    ss58: 0,
    decimals: 10,
    token: 'DOT',
    subscan: 'https://polkadot.subscan.io',
    color: 'pink'
  },
  kusama: {
    name: 'Kusama',
    assetHub: 'wss://asset-hub-kusama.dotters.network',
    relay: 'wss://kusama.dotters.network',
    ss58: 2,
    decimals: 12,
    token: 'KSM',
    subscan: 'https://kusama.subscan.io',
    color: 'gray'
  },
  paseo: {
    name: 'Paseo',
    assetHub: 'wss://asset-hub-paseo.dotters.network',
    relay: 'wss://paseo.dotters.network',
    ss58: 0,
    decimals: 10,
    token: 'PAS',
    subscan: 'https://paseo.subscan.io',
    color: 'green'
  }
}

interface ValidatorStatus {
  address: string
  name: string
  isActive: boolean
  totalStake: bigint
  ownStake: bigint
  commission: number
  nominatorCount: number
  eraPoints: number
  isOversubscribed: boolean
  grade?: ValidatorGrade
}

const StakingPage: Component = () => {
  const params = useParams()
  const [validators, setValidators] = createSignal<ValidatorStatus[]>([])
  const [loading, setLoading] = createSignal(true)
  const [currentEra, setCurrentEra] = createSignal<number | null>(null)
  const [eraProgress, setEraProgress] = createSignal(0)
  const [error, setError] = createSignal<string | null>(null)
  let client: any = null

  const network = () => params.network?.toLowerCase() || 'polkadot'
  const config = () => CHAINS[network()] || CHAINS.polkadot

  const formatBalance = (value: bigint): string => {
    const cfg = config()
    const divisor = 10n ** BigInt(cfg.decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 100n / divisor).toString().padStart(2, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  const loadValidators = async () => {
    const chainId = network()
    const cfg = config()
    const rotkoValidators = ROTKO_VALIDATORS[chainId] || []

    if (rotkoValidators.length === 0) {
      setValidators([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      client = createClient(getWsProvider(cfg.assetHub))
      const api = await client.getUnsafeApi()

      // Get era info
      let era = 0
      try {
        const activeEra = await api.query.Staking.ActiveEra.getValue()
        if (activeEra) {
          era = activeEra.index
          setCurrentEra(era)
        }
      } catch (e) {}

      // Get active validators
      let activeSet = new Set<string>()
      try {
        const sessionValidators = await api.query.Session.Validators.getValue()
        if (sessionValidators) {
          activeSet = new Set(sessionValidators.map((v: any) => v.toString()))
        }
      } catch (e) {}

      // Get era points
      let eraPointsMap = new Map<string, number>()
      let totalPoints = 0
      try {
        if (era > 0) {
          const eraRewardPoints = await api.query.Staking.ErasRewardPoints.getValue(era)
          if (eraRewardPoints) {
            totalPoints = Number(eraRewardPoints.total || 0)
            if (eraRewardPoints.individual) {
              for (const [addr, points] of eraRewardPoints.individual) {
                eraPointsMap.set(addr.toString(), Number(points))
              }
            }
          }
        }
      } catch (e) {}

      // Fetch turboflakes grades
      let grades = new Map<string, ValidatorGrade>()
      if (chainId === 'polkadot' || chainId === 'kusama') {
        const addresses = rotkoValidators.map(v => v.address)
        grades = await turboflakesService.getValidatorGrades(chainId, addresses)
      }

      const results: ValidatorStatus[] = []

      for (const rv of rotkoValidators) {
        const isActive = activeSet.has(rv.address)
        let totalStake = 0n, ownStake = 0n, commission = 0, nominatorCount = 0, isOversubscribed = false

        try {
          const prefs = await api.query.Staking.Validators.getValue(rv.address)
          if (prefs) commission = Number(prefs.commission) / 10000000

          if (era > 0) {
            const exposure = await api.query.Staking.ErasStakers.getValue(era, rv.address)
            if (exposure) {
              totalStake = BigInt(exposure.total?.toString() || '0')
              ownStake = BigInt(exposure.own?.toString() || '0')
              nominatorCount = exposure.others?.length || 0
              isOversubscribed = nominatorCount >= 512
            }
          }
        } catch (e) {}

        results.push({
          address: rv.address,
          name: rv.name,
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

      setValidators(results)
    } catch (err) {
      console.error('Failed to load validators:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    const _ = network() // track network changes
    loadValidators()
  })

  onCleanup(() => {
    try { client?.destroy?.() } catch (e) {}
  })

  const activeCount = () => validators().filter(v => v.isActive).length
  const totalStaked = () => validators().reduce((sum, v) => sum + v.totalStake, 0n)

  return (
    <MainLayout>
      <div class="min-h-screen">
        {/* Header */}
        <div class="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-black">
          <div class="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div class="text-sm text-gray-500 mb-4">
              <A href="/services" class="hover:text-cyan-400">Services</A>
              <span class="mx-2">/</span>
              <A href="/services/staking" class="hover:text-cyan-400">Staking</A>
              <span class="mx-2">/</span>
              <span class="text-white">{config().name}</span>
            </div>

            <div class="flex items-center gap-4 mb-6">
              <img src="/images/rotko-icon.svg" alt="Rotko" class="w-12 h-12" />
              <div>
                <h1 class="text-2xl font-bold text-cyan-400">
                  {config().name} Validators
                </h1>
                <p class="text-gray-400">Rotko Networks staking on {config().name}</p>
              </div>
            </div>

            {/* Network Tabs */}
            <div class="flex flex-wrap gap-2">
              <For each={Object.entries(CHAINS)}>
                {([chainId, cfg]) => (
                  <A
                    href={`/services/staking/${chainId}`}
                    class={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      network() === chainId
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {cfg.name}
                    <span class="ml-2 text-xs opacity-60">
                      ({ROTKO_VALIDATORS[chainId]?.length || 0})
                    </span>
                  </A>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div class="border-b border-gray-800 bg-gray-900/50">
          <div class="max-w-6xl mx-auto px-4 py-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div class="text-gray-500">Validators</div>
                <div class="text-xl font-bold text-white">{validators().length}</div>
              </div>
              <div>
                <div class="text-gray-500">Active</div>
                <div class="text-xl font-bold text-green-400">{activeCount()}</div>
              </div>
              <div>
                <div class="text-gray-500">Total Staked</div>
                <div class="text-xl font-bold text-cyan-400">
                  {formatBalance(totalStaked())} {config().token}
                </div>
              </div>
              <Show when={currentEra()}>
                <div>
                  <div class="text-gray-500">Era {currentEra()}</div>
                  <div class="w-full h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div
                      class="h-full bg-cyan-500 transition-all"
                      style={`width: ${eraProgress()}%`}
                    />
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* Content */}
        <div class="max-w-6xl mx-auto px-4 py-8">
          {/* Loading */}
          <Show when={loading()}>
            <div class="text-center py-12">
              <div class="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p class="text-gray-400">Connecting to {config().name}...</p>
            </div>
          </Show>

          {/* Error */}
          <Show when={error()}>
            <div class="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 mb-6">
              {error()}
            </div>
          </Show>

          {/* Validators */}
          <Show when={!loading() && validators().length > 0}>
            <div class="space-y-4">
              <For each={validators()}>
                {(validator) => (
                  <div class={`p-6 rounded-lg border transition-all ${
                    validator.isActive
                      ? 'bg-green-900/10 border-green-800/50'
                      : 'bg-gray-900/50 border-gray-800'
                  }`}>
                    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div class="flex items-center gap-3">
                          <h3 class="text-lg font-semibold text-white">{validator.name}</h3>
                          <Show when={validator.grade}>
                            <div
                              class={`px-2 py-1 rounded text-sm font-bold ${
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
                        <a
                          href={`${config().subscan}/account/${validator.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="font-mono text-sm text-gray-500 hover:text-cyan-400 mt-1 inline-block"
                        >
                          {validator.address}
                        </a>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div class="text-gray-500 text-sm">Total Stake</div>
                        <div class="font-mono text-cyan-400">
                          {formatBalance(validator.totalStake)} {config().token}
                        </div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-sm">Self Stake</div>
                        <div class="font-mono text-white">
                          {formatBalance(validator.ownStake)} {config().token}
                        </div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-sm">Commission</div>
                        <div class={validator.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                          {validator.commission.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-sm">Nominators</div>
                        <div class={validator.isOversubscribed ? 'text-red-400' : 'text-white'}>
                          {validator.nominatorCount}
                          {validator.isOversubscribed && ' (oversubscribed)'}
                        </div>
                      </div>
                      <Show when={validator.eraPoints > 0}>
                        <div>
                          <div class="text-gray-500 text-sm">Era Points</div>
                          <div class="text-purple-400 font-mono">{validator.eraPoints.toLocaleString()}</div>
                        </div>
                      </Show>
                      <Show when={validator.grade}>
                        <div>
                          <div class="text-gray-500 text-sm">MVR</div>
                          <div class={validator.grade!.mvr < 0.05 ? 'text-green-400' : validator.grade!.mvr < 0.1 ? 'text-yellow-400' : 'text-red-400'}>
                            {(validator.grade!.mvr * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div class="text-gray-500 text-sm">BAR</div>
                          <div class={validator.grade!.bar > 0.98 ? 'text-green-400' : validator.grade!.bar > 0.95 ? 'text-yellow-400' : 'text-red-400'}>
                            {(validator.grade!.bar * 100).toFixed(2)}%
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Footer Info */}
            <div class="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-500">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Show when={network() === 'polkadot' || network() === 'kusama'}>
                    Grades from <a href="https://turboflakes.io" target="_blank" class="text-cyan-400 hover:underline">Turboflakes ONE-T</a>.
                    MVR = Missed Votes Ratio | BAR = Bitfield Availability Ratio
                  </Show>
                </div>
                <A href="/software/vctl" class="text-cyan-400 hover:text-cyan-300">
                  Manage Staking with vctl →
                </A>
              </div>
            </div>
          </Show>

          {/* No validators */}
          <Show when={!loading() && validators().length === 0 && !error()}>
            <div class="text-center py-12 text-gray-500">
              No Rotko validators on {config().name}
            </div>
          </Show>
        </div>
      </div>
    </MainLayout>
  )
}

export default StakingPage
