import { Component, createSignal, createEffect, For, Show } from 'solid-js'
import { multiChainServicePapi, type ValidatorEntry } from '../../services/multi-chain-service-papi'
import { ROTKO_VALIDATORS } from '../../data/validator-data'
import type { ChainId, ChainConfig } from '../../types/polkadot'

interface RotkoValidatorStatusProps {
  chainId: ChainId
  config: ChainConfig
}

interface ValidatorStatus extends ValidatorEntry {
  name: string
  eraPoints?: number
  lastReward?: bigint
}

export const RotkoValidatorStatus: Component<RotkoValidatorStatusProps> = (props) => {
  const [validators, setValidators] = createSignal<ValidatorStatus[]>([])
  const [loading, setLoading] = createSignal(true)
  const [currentEra, setCurrentEra] = createSignal<number | null>(null)
  const [eraProgress, setEraProgress] = createSignal<number>(0)

  const formatBalance = (value: bigint): string => {
    const divisor = 10n ** BigInt(props.config.decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 100n / divisor).toString().padStart(2, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  // Load validator status
  createEffect(async () => {
    const chain = props.chainId
    setLoading(true)

    try {
      const rotkoValidators = ROTKO_VALIDATORS[chain] || []
      if (rotkoValidators.length === 0) {
        setValidators([])
        setLoading(false)
        return
      }

      // Get all validators from chain
      const allValidators = await multiChainServicePapi.getValidators()

      // Get era info
      const eraInfo = await multiChainServicePapi.getEraInfo()
      if (eraInfo) {
        setCurrentEra(eraInfo.currentEra)
        setEraProgress(eraInfo.eraProgress)
      }

      // Match our validators with chain data
      const statuses: ValidatorStatus[] = []

      for (const rv of rotkoValidators) {
        const chainData = allValidators.find(v => v.address === rv.address)

        if (chainData) {
          statuses.push({
            ...chainData,
            name: rv.name,
            // TODO: Get era points from chain
          })
        } else {
          // Validator not found in chain data - might be inactive
          statuses.push({
            address: rv.address,
            name: rv.name,
            commission: 0,
            totalStake: 0n,
            ownStake: 0n,
            nominatorCount: 0,
            isActive: false,
            isOversubscribed: false,
            isBlocked: false,
          })
        }
      }

      setValidators(statuses)
    } catch (err) {
      console.error('Failed to load Rotko validator status:', err)
    } finally {
      setLoading(false)
    }
  })

  const totalStaked = () => validators().reduce((sum, v) => sum + v.totalStake, 0n)
  const activeCount = () => validators().filter(v => v.isActive).length

  return (
    <div class="bg-gradient-to-br from-cyan-900/20 to-gray-900 border border-cyan-800/50 rounded-lg overflow-hidden mb-6">
      {/* Header */}
      <div class="p-4 border-b border-cyan-800/30 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/rotko-icon.svg" alt="Rotko" class="w-8 h-8" />
          <div>
            <h3 class="font-bold text-cyan-400">Rotko Validators</h3>
            <p class="text-xs text-gray-500">
              {activeCount()}/{validators().length} active on {props.config.name}
            </p>
          </div>
        </div>
        <Show when={currentEra()}>
          <div class="text-right">
            <div class="text-xs text-gray-500">Era {currentEra()}</div>
            <div class="w-24 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
              <div
                class="h-full bg-cyan-500 transition-all"
                style={`width: ${eraProgress()}%`}
              />
            </div>
          </div>
        </Show>
      </div>

      {/* Loading state */}
      <Show when={loading()}>
        <div class="p-8 text-center">
          <div class="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
          <span class="text-sm text-gray-400">Loading validator status...</span>
        </div>
      </Show>

      {/* Validator Grid */}
      <Show when={!loading() && validators().length > 0}>
        <div class="p-4">
          <div class="grid gap-3 md:grid-cols-2">
            <For each={validators()}>
              {(validator) => (
                <div class={`p-4 rounded-lg border transition-all ${
                  validator.isActive
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-gray-900/50 border-gray-700/50'
                }`}>
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="font-semibold text-white">{validator.name}</div>
                      <div class="font-mono text-xs text-gray-500">
                        {validator.address.slice(0, 8)}...{validator.address.slice(-6)}
                      </div>
                    </div>
                    <span class={`px-2 py-1 text-xs rounded ${
                      validator.isActive
                        ? 'bg-green-900/50 text-green-400'
                        : validator.isBlocked
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-gray-800 text-gray-400'
                    }`}>
                      {validator.isActive ? 'Active' : validator.isBlocked ? 'Blocked' : 'Waiting'}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-gray-500">Total Stake</span>
                      <div class="font-mono text-cyan-400">
                        {formatBalance(validator.totalStake)} {props.config.token}
                      </div>
                    </div>
                    <div>
                      <span class="text-gray-500">Self Stake</span>
                      <div class="font-mono text-white">
                        {formatBalance(validator.ownStake)} {props.config.token}
                      </div>
                    </div>
                    <div>
                      <span class="text-gray-500">Commission</span>
                      <div class={validator.commission > 10 ? 'text-yellow-400' : 'text-green-400'}>
                        {validator.commission.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span class="text-gray-500">Nominators</span>
                      <div class={`${validator.isOversubscribed ? 'text-red-400' : 'text-white'}`}>
                        {validator.nominatorCount}
                        {validator.isOversubscribed && ' (full)'}
                      </div>
                    </div>
                  </div>

                  <Show when={validator.identity}>
                    <div class="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-400">
                      Identity: {validator.identity}
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>

          {/* Summary */}
          <div class="mt-4 pt-4 border-t border-cyan-800/30 flex items-center justify-between text-sm">
            <div>
              <span class="text-gray-500">Total Staked:</span>
              <span class="text-cyan-400 font-mono ml-2">
                {formatBalance(totalStaked())} {props.config.token}
              </span>
            </div>
            <a
              href={`https://${props.chainId}.subscan.io/validator`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-cyan-400 hover:text-cyan-300 text-xs"
            >
              View on Subscan →
            </a>
          </div>
        </div>
      </Show>

      {/* No validators */}
      <Show when={!loading() && validators().length === 0}>
        <div class="p-8 text-center text-gray-500">
          No Rotko validators configured for {props.config.name}
        </div>
      </Show>
    </div>
  )
}
