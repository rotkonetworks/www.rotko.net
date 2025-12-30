import { Component, For, Show, createSignal, createEffect, onCleanup } from 'solid-js'
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import MainLayout from '../layouts/MainLayout'
import { servicesData } from '../data/services-data'
import { ROTKO_VALIDATORS } from '../data/validator-data'
import { turboflakesService, type ValidatorGrade } from '../services/turboflakes-service'

interface ChainConfig {
  name: string
  assetHub: string
  ss58: number
  decimals: number
  token: string
}

const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    assetHub: 'wss://asset-hub-polkadot.dotters.network',
    ss58: 0,
    decimals: 10,
    token: 'DOT'
  },
  kusama: {
    name: 'Kusama',
    assetHub: 'wss://asset-hub-kusama.dotters.network',
    ss58: 2,
    decimals: 12,
    token: 'KSM'
  },
  paseo: {
    name: 'Paseo',
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
  grade?: ValidatorGrade
}

const ServicesPage: Component = () => {
  const [validators, setValidators] = createSignal<ValidatorStatus[]>([])
  const [loading, setLoading] = createSignal(true)
  const [selectedChain, setSelectedChain] = createSignal<string | null>(null)
  const clients: Record<string, any> = {}

  const formatBalance = (value: bigint, decimals: number): string => {
    const divisor = 10n ** BigInt(decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 100n / divisor).toString().padStart(2, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  const loadValidators = async () => {
    setLoading(true)
    const allValidators: ValidatorStatus[] = []

    for (const [chainId, config] of Object.entries(CHAINS)) {
      const rotkoValidators = ROTKO_VALIDATORS[chainId] || []
      if (rotkoValidators.length === 0) continue

      try {
        const client = createClient(getWsProvider(config.assetHub))
        clients[chainId] = client
        const api = await client.getUnsafeApi()

        // Get current era
        let currentEra = 0
        try {
          const activeEra = await api.query.Staking.ActiveEra.getValue()
          if (activeEra) currentEra = activeEra.index
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
        try {
          if (currentEra > 0) {
            const eraRewardPoints = await api.query.Staking.ErasRewardPoints.getValue(currentEra)
            if (eraRewardPoints?.individual) {
              for (const [addr, points] of eraRewardPoints.individual) {
                eraPointsMap.set(addr.toString(), Number(points))
              }
            }
          }
        } catch (e) {}

        // Fetch grades for polkadot/kusama
        let grades = new Map<string, ValidatorGrade>()
        if (chainId === 'polkadot' || chainId === 'kusama') {
          const addresses = rotkoValidators.map(v => v.address)
          grades = await turboflakesService.getValidatorGrades(chainId, addresses)
        }

        for (const rv of rotkoValidators) {
          const isActive = activeSet.has(rv.address)
          let totalStake = 0n, ownStake = 0n, commission = 0, nominatorCount = 0

          try {
            const prefs = await api.query.Staking.Validators.getValue(rv.address)
            if (prefs) commission = Number(prefs.commission) / 10000000

            if (currentEra > 0) {
              const exposure = await api.query.Staking.ErasStakers.getValue(currentEra, rv.address)
              if (exposure) {
                totalStake = BigInt(exposure.total?.toString() || '0')
                ownStake = BigInt(exposure.own?.toString() || '0')
                nominatorCount = exposure.others?.length || 0
              }
            }
          } catch (e) {}

          allValidators.push({
            address: rv.address,
            name: rv.name,
            chain: chainId,
            isActive,
            totalStake,
            ownStake,
            commission,
            nominatorCount,
            eraPoints: eraPointsMap.get(rv.address) || 0,
            grade: grades.get(rv.address)
          })
        }
      } catch (err) {
        console.error(`[${chainId}] Failed to load validators:`, err)
      }
    }

    setValidators(allValidators)
    setLoading(false)
  }

  createEffect(() => {
    loadValidators()
  })

  onCleanup(() => {
    for (const client of Object.values(clients)) {
      try { client?.destroy?.() } catch (e) {}
    }
  })

  const filteredValidators = () => {
    const chain = selectedChain()
    if (!chain) return validators()
    return validators().filter(v => v.chain === chain)
  }

  const activeCount = () => validators().filter(v => v.isActive).length
  const totalCount = () => validators().length

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400 mb-2">
            {servicesData.hero.title}
          </h1>
          <p class="text-gray-300">
            {servicesData.hero.subtitle}
          </p>
        </div>

        {/* Staking Services - Live Validators */}
        <div class="mb-12 border border-cyan-800/50 bg-gradient-to-br from-cyan-900/20 to-gray-900 rounded-lg overflow-hidden">
          <div class="p-6 border-b border-cyan-800/30">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-3">
                <img src="/images/rotko-icon.svg" alt="Rotko" class="w-10 h-10" />
                <div>
                  <h2 class="text-xl font-bold text-cyan-400">Staking Services</h2>
                  <p class="text-sm text-gray-400">Live validator status across networks</p>
                </div>
              </div>
              <div class="flex items-center gap-4 text-sm">
                <div>
                  <span class="text-gray-500">Validators:</span>
                  <span class="text-white ml-2 font-mono">{totalCount()}</span>
                </div>
                <div>
                  <span class="text-gray-500">Active:</span>
                  <span class="text-green-400 ml-2 font-mono">{activeCount()}</span>
                </div>
              </div>
            </div>

            {/* Chain Filter */}
            <div class="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setSelectedChain(null)}
                class={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedChain() === null
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <For each={Object.entries(CHAINS)}>
                {([chainId, config]) => (
                  <button
                    onClick={() => setSelectedChain(chainId)}
                    class={`px-3 py-1.5 rounded text-xs transition-colors ${
                      selectedChain() === chainId
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {config.name} ({ROTKO_VALIDATORS[chainId]?.length || 0})
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Loading */}
          <Show when={loading()}>
            <div class="p-8 text-center">
              <div class="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
              <span class="text-sm text-gray-400">Connecting to networks...</span>
            </div>
          </Show>

          {/* Validators Grid */}
          <Show when={!loading()}>
            <div class="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <For each={filteredValidators()}>
                {(validator) => {
                  const config = CHAINS[validator.chain]
                  return (
                    <div class={`p-4 rounded-lg border transition-all ${
                      validator.isActive
                        ? 'bg-green-900/10 border-green-800/50'
                        : 'bg-gray-900/50 border-gray-800'
                    }`}>
                      <div class="flex items-start justify-between mb-2">
                        <div>
                          <div class="font-semibold text-white text-sm">{validator.name}</div>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
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
                        <div class="flex items-center gap-1">
                          <Show when={validator.grade}>
                            <div
                              class={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                turboflakesService.getGradeBgColor(validator.grade!.grade)
                              } ${turboflakesService.getGradeColor(validator.grade!.grade)}`}
                              title={`MVR: ${(validator.grade!.mvr * 100).toFixed(2)}% | BAR: ${(validator.grade!.bar * 100).toFixed(2)}%`}
                            >
                              {validator.grade!.grade}
                            </div>
                          </Show>
                          <span class={`px-1.5 py-0.5 text-xs rounded ${
                            validator.isActive
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-gray-800 text-gray-500'
                          }`}>
                            {validator.isActive ? 'Active' : 'Wait'}
                          </span>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div class="text-gray-500">Stake</div>
                          <div class="font-mono text-cyan-400">
                            {formatBalance(validator.totalStake, config.decimals)} {config.token}
                          </div>
                        </div>
                        <div>
                          <div class="text-gray-500">Commission</div>
                          <div class={validator.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                            {validator.commission.toFixed(1)}%
                          </div>
                        </div>
                        <Show when={validator.eraPoints > 0}>
                          <div>
                            <div class="text-gray-500">Era Points</div>
                            <div class="text-purple-400 font-mono">{validator.eraPoints.toLocaleString()}</div>
                          </div>
                        </Show>
                        <div>
                          <div class="text-gray-500">Nominators</div>
                          <div class="text-white">{validator.nominatorCount}</div>
                        </div>
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>

            {/* Staking Info */}
            <div class="p-4 border-t border-cyan-800/30 bg-gray-900/30">
              <div class="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div class="text-gray-500">
                  Grades from <a href="https://turboflakes.io" target="_blank" class="text-cyan-400 hover:underline">Turboflakes ONE-T</a> (Polkadot/Kusama)
                </div>
                <a href="/software/vctl" class="text-cyan-400 hover:text-cyan-300">
                  Manage Staking →
                </a>
              </div>
            </div>
          </Show>
        </div>

        {/* Other Services Grid */}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          <For each={servicesData.services.filter(s => s.title !== 'Staking Services')}>
            {(service) => (
              <div class="border border-gray-700 p-6 bg-gray-900 h-full flex flex-col">
                <div class="flex items-center gap-3 mb-4">
                  <div class={`${service.iconClass} text-2xl text-cyan-400`}></div>
                  <h2 class="text-xl font-bold text-cyan-400">{service.title}</h2>
                </div>
                <p class="text-gray-400 text-sm mb-4">{service.description}</p>
                <ul class="text-sm space-y-1 flex-1">
                  <For each={service.features}>
                    {(feature) => (
                      <li class="text-gray-300 flex items-start">
                        <span class="text-cyan-500 mr-2">•</span>
                        {feature}
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
        </div>

        {/* Network Support */}
        <div class="mb-12 border border-gray-700 p-6 bg-gray-900">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Supported Networks</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <For each={servicesData.networks}>
              {(network) => (
                <div class="text-gray-300">• {network}</div>
              )}
            </For>
          </div>
        </div>

        {/* Stats */}
        <div class="mb-12 border border-gray-700 p-6 bg-gray-900">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Service Metrics</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <For each={servicesData.stats}>
              {(stat) => (
                <div>
                  <span class="text-cyan-400 font-mono font-bold">{stat.value}</span>
                  <span class="text-gray-400 ml-2">{stat.label}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Contact */}
        <div class="border border-gray-700 p-6 bg-gray-900">
          <h2 class="text-xl font-bold text-cyan-400 mb-2">{servicesData.cta.title}</h2>
          <p class="text-gray-400 text-sm mb-4">{servicesData.cta.description}</p>
          <div class="flex gap-4">
            <a
              href={servicesData.cta.primaryButton.href}
              class="text-cyan-400 hover:text-cyan-300 underline"
            >
              {servicesData.cta.primaryButton.text}
            </a>
            <span class="text-gray-600">|</span>
            <a
              href={servicesData.cta.secondaryButton.href}
              target="_blank"
              rel="noopener noreferrer"
              class="text-cyan-400 hover:text-cyan-300 underline"
            >
              {servicesData.cta.secondaryButton.text}
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default ServicesPage
