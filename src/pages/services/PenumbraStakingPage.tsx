import { Component, createSignal, createEffect, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../../layouts/MainLayout'
import { ROTKO_VALIDATORS } from '../../data/validator-data'
import { STAKING_CHAINS } from '../../data/staking-data'

interface PenumbraValidator {
  address: string
  name: string
  votingPower: string
  votingPowerPercent: string
  commission: string
  uptime: string
  status: 'active' | 'inactive' | 'jailed'
}

const PenumbraStakingPage: Component = () => {
  const [validators, setValidators] = createSignal<PenumbraValidator[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  // Static data from validator info - would need Penumbra API for live data
  createEffect(() => {
    const rotkoValidators = ROTKO_VALIDATORS.penumbra || []

    // For now, use static data from the validator info provided
    const staticData: PenumbraValidator[] = rotkoValidators.map(v => ({
      address: v.address,
      name: v.name,
      votingPower: '1,044,178 UM',
      votingPowerPercent: '8.10%',
      commission: '1.00%',
      uptime: '100.00%',
      status: 'active' as const
    }))

    setValidators(staticData)
    setLoading(false)
  })

  return (
    <MainLayout>
      <div class="min-h-screen">
        {/* Header */}
        <div class="border-b border-gray-800 bg-gradient-to-b from-purple-900/20 to-black">
          <div class="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div class="text-sm text-gray-500 mb-4">
              <A href="/services" class="hover:text-cyan-400">Services</A>
              <span class="mx-2">/</span>
              <A href="/services/staking" class="hover:text-cyan-400">Staking</A>
              <span class="mx-2">/</span>
              <span class="text-white">Penumbra</span>
            </div>

            <div class="flex items-center gap-4 mb-6">
              <img src="/images/rotko-icon.svg" alt="Rotko" class="w-12 h-12" />
              <div>
                <h1 class="text-2xl font-bold text-purple-400">
                  Penumbra Validators
                </h1>
                <p class="text-gray-400">Private PoS with shielded staking</p>
              </div>
            </div>

            {/* Network Tabs */}
            <div class="flex flex-wrap gap-2">
              <For each={Object.entries(STAKING_CHAINS)}>
                {([chainId, cfg]) => (
                  <A
                    href={`/services/staking/${chainId}`}
                    class={`px-4 py-2  text-sm transition-colors ${
                      chainId === 'penumbra'
                        ? 'bg-purple-600 text-white'
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

        {/* Stats */}
        <div class="border-b border-gray-800 bg-gray-900/50">
          <div class="max-w-6xl mx-auto px-4 py-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div class="text-gray-500">Validators</div>
                <div class="text-xl font-bold text-white">{validators().length}</div>
              </div>
              <div>
                <div class="text-gray-500">Status</div>
                <div class="text-xl font-bold text-green-400">Active</div>
              </div>
              <div>
                <div class="text-gray-500">Network</div>
                <div class="text-xl font-bold text-purple-400">Penumbra</div>
              </div>
              <div>
                <div class="text-gray-500">Token</div>
                <div class="text-xl font-bold text-white">UM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div class="max-w-6xl mx-auto px-4 py-8">
          <Show when={loading()}>
            <div class="text-center py-12">
              <div class="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p class="text-gray-400">Loading validators...</p>
            </div>
          </Show>

          <Show when={error()}>
            <div class="p-4 bg-red-900/20 border border-red-800  text-red-400 mb-6">
              {error()}
            </div>
          </Show>

          <Show when={!loading() && validators().length > 0}>
            <div class="space-y-4">
              <For each={validators()}>
                {(validator) => (
                  <div class={`p-6  border transition-all ${
                    validator.status === 'active'
                      ? 'bg-green-900/10 border-green-800/50'
                      : 'bg-gray-900/50 border-gray-800'
                  }`}>
                    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div class="flex items-center gap-3">
                          <h3 class="text-lg font-semibold text-white">{validator.name}</h3>
                          <span class={`px-2 py-1 text-xs ${
                            validator.status === 'active'
                              ? 'bg-green-900/50 text-green-400'
                              : validator.status === 'jailed'
                                ? 'bg-red-900/50 text-red-400'
                                : 'bg-gray-800 text-gray-500'
                          }`}>
                            {validator.status === 'active' ? 'Active' : validator.status === 'jailed' ? 'Jailed' : 'Inactive'}
                          </span>
                        </div>
                        <a
                          href={`https://explorer.penumbra.zone/validator/${validator.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="font-mono text-xs text-gray-500 hover:text-purple-400 mt-1 inline-block break-all"
                        >
                          {validator.address}
                        </a>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div class="text-gray-500 text-sm">Voting Power</div>
                        <div class="font-mono text-purple-400">{validator.votingPower}</div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-sm">Power %</div>
                        <div class="text-white">{validator.votingPowerPercent}</div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-sm">Commission</div>
                        <div class="text-green-400">{validator.commission}</div>
                      </div>
                      <div>
                        <div class="text-gray-500 text-sm">Uptime</div>
                        <div class={
                          parseFloat(validator.uptime) >= 99 ? 'text-green-400' :
                          parseFloat(validator.uptime) >= 95 ? 'text-yellow-400' : 'text-red-400'
                        }>
                          {validator.uptime}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Info */}
            <div class="mt-8 p-4 bg-gray-900/50 border border-gray-800  text-sm text-gray-500">
              <h3 class="text-white font-semibold mb-2">About Penumbra Staking</h3>
              <ul class="space-y-1">
                <li>• Penumbra is a private PoS network with shielded transactions</li>
                <li>• Validators participate in consensus and earn UM rewards</li>
                <li>• Delegators can stake to validators while maintaining privacy</li>
                <li>• Commission is taken from staking rewards</li>
              </ul>
              <div class="mt-4">
                <a
                  href="https://explorer.penumbra.zone/validators"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-purple-400 hover:text-purple-300"
                >
                  [view all validators]
                </a>
              </div>
            </div>
          </Show>

          <Show when={!loading() && validators().length === 0 && !error()}>
            <div class="text-center py-12 text-gray-500">
              No Rotko validators on Penumbra
            </div>
          </Show>
        </div>
      </div>
    </MainLayout>
  )
}

export default PenumbraStakingPage
