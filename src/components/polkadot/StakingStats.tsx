import { Component, createSignal, createEffect, onCleanup, Show, For } from 'solid-js'
import { PolkadotStakingService, type EraInfo, type ValidatorInfo, type StakingInfo } from '../../services/polkadot-staking-simple'
import type { ChainId } from '../../types/polkadot'

interface StakingStatsProps {
  chainId: ChainId
  endpoint: string
  address?: string
}

export const StakingStats: Component<StakingStatsProps> = (props) => {
  const [loading, setLoading] = createSignal(true)
  const [eraInfo, setEraInfo] = createSignal<EraInfo | null>(null)
  const [validatorInfo, setValidatorInfo] = createSignal<ValidatorInfo | null>(null)
  const [stakingInfo, setStakingInfo] = createSignal<StakingInfo | null>(null)
  const [activeValidators, setActiveValidators] = createSignal<ValidatorInfo[]>([])
  const [minimums, setMinimums] = createSignal<any>(null)
  const [error, setError] = createSignal<string | null>(null)

  let stakingService: PolkadotStakingService | null = null
  let unsubscribeEra: (() => void) | null = null
  let unsubscribeValidator: (() => void) | null = null

  const formatAmount = (amount: string, decimals: number = 10): string => {
    const amountBig = BigInt(amount)
    const divisor = BigInt(10 ** decimals)
    const whole = amountBig / divisor
    const remainder = amountBig % divisor
    const decimal = remainder.toString().padStart(decimals, '0').slice(0, 4)
    return `${whole.toLocaleString()}.${decimal}`
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`
  }

  createEffect(async () => {
    const chain = props.chainId
    const endpoint = props.endpoint

    try {
      setLoading(true)
      setError(null)

      // Clean up previous connection
      if (stakingService) {
        if (unsubscribeEra) unsubscribeEra()
        if (unsubscribeValidator) unsubscribeValidator()
        await stakingService.disconnect()
      }

      // Create new service
      stakingService = new PolkadotStakingService(chain)
      await stakingService.connect(endpoint)

      // Get initial data
      const [era, mins] = await Promise.all([
        stakingService.getEraInfo(),
        stakingService.getMinimumAmounts()
      ])

      setEraInfo(era)
      setMinimums(mins)

      // Get active validators
      const validators = await stakingService.getActiveValidators()
      setActiveValidators(validators.slice(0, 10)) // Show top 10

      // If address provided, get specific info
      if (props.address) {
        const [validator, staking] = await Promise.all([
          stakingService.getValidatorInfo(props.address),
          stakingService.getStakingInfo(props.address)
        ])

        setValidatorInfo(validator)
        setStakingInfo(staking)

        // Subscribe to validator updates
        unsubscribeValidator = stakingService.watchValidator(props.address, (info) => {
          setValidatorInfo(info)
        })
      }

      // Subscribe to era updates
      unsubscribeEra = stakingService.watchEraInfo((info) => {
        setEraInfo(info)
      })

      setLoading(false)
    } catch (err) {
      console.error('Failed to connect to staking service:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setLoading(false)
    }
  })

  onCleanup(async () => {
    if (unsubscribeEra) unsubscribeEra()
    if (unsubscribeValidator) unsubscribeValidator()
    if (stakingService) await stakingService.disconnect()
  })

  const getTokenSymbol = () => {
    switch (props.chainId) {
      case 'polkadot': return 'DOT'
      case 'kusama': return 'KSM'
      case 'paseo': return 'PAS'
      default: return 'TOKEN'
    }
  }

  const getDecimals = () => {
    return props.chainId === 'kusama' ? 12 : 10
  }

  return (
    <div class="space-y-6">
      <Show when={error()}>
        <div class="p-4 bg-red-900/20 border border-red-700 rounded">
          <p class="text-red-400">{error()}</p>
        </div>
      </Show>

      <Show when={loading()}>
        <div class="p-8 text-center text-gray-400">
          Loading staking data...
        </div>
      </Show>

      <Show when={!loading() && !error()}>
        {/* Era Information */}
        <Show when={eraInfo()}>
          <div class="bg-gray-900 border border-gray-700 rounded p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Era Information</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-400">Current Era:</span>
                <span class="text-white ml-2 font-mono">{eraInfo()!.currentEra}</span>
              </div>
              <div>
                <span class="text-gray-400">Active Era:</span>
                <span class="text-white ml-2 font-mono">{eraInfo()!.activeEra}</span>
              </div>
              <div>
                <span class="text-gray-400">Session:</span>
                <span class="text-white ml-2">{formatPercentage(eraInfo()!.sessionProgress)}</span>
              </div>
              <div>
                <span class="text-gray-400">Era Progress:</span>
                <span class="text-white ml-2">{formatPercentage(eraInfo()!.eraProgress)}</span>
              </div>
            </div>

            {/* Progress bars */}
            <div class="mt-4 space-y-2">
              <div>
                <div class="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Session Progress</span>
                  <span>{formatPercentage(eraInfo()!.sessionProgress)}</span>
                </div>
                <div class="h-2 bg-gray-800 rounded overflow-hidden">
                  <div
                    class="h-full bg-cyan-600 transition-all duration-300"
                    style={`width: ${eraInfo()!.sessionProgress}%`}
                  />
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Era Progress</span>
                  <span>{eraInfo()!.remainingBlocks} blocks remaining</span>
                </div>
                <div class="h-2 bg-gray-800 rounded overflow-hidden">
                  <div
                    class="h-full bg-green-600 transition-all duration-300"
                    style={`width: ${eraInfo()!.eraProgress}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Validator Information */}
        <Show when={validatorInfo()}>
          <div class="bg-gray-900 border border-gray-700 rounded p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Validator Details</h3>
            <div class="space-y-3">
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-400">Status:</span>
                  <span class={`ml-2 px-2 py-1 rounded text-xs ${
                    validatorInfo()!.status === 'active' ? 'bg-green-900/30 text-green-400' :
                    validatorInfo()!.status === 'waiting' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {validatorInfo()!.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span class="text-gray-400">Commission:</span>
                  <span class="text-white ml-2">{formatPercentage(validatorInfo()!.commission)}</span>
                </div>
                <div>
                  <span class="text-gray-400">Blocked:</span>
                  <span class={`ml-2 ${validatorInfo()!.blocked ? 'text-red-400' : 'text-green-400'}`}>
                    {validatorInfo()!.blocked ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">Total Stake:</span>
                  <span class="text-white font-mono">
                    {formatAmount(validatorInfo()!.total, getDecimals())} {getTokenSymbol()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Own Stake:</span>
                  <span class="text-white font-mono">
                    {formatAmount(validatorInfo()!.own, getDecimals())} {getTokenSymbol()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Nominators:</span>
                  <span class="text-white">{validatorInfo()!.nominators.length}</span>
                </div>
              </div>

              {/* Top Nominators */}
              <Show when={validatorInfo()!.nominators.length > 0}>
                <div class="mt-4">
                  <h4 class="text-sm text-gray-400 mb-2">Top Nominators</h4>
                  <div class="space-y-1 max-h-40 overflow-y-auto">
                    <For each={validatorInfo()!.nominators.slice(0, 5)}>
                      {(nominator) => (
                        <div class="flex justify-between text-xs">
                          <span class="font-mono text-gray-500">
                            {nominator.address.slice(0, 8)}...{nominator.address.slice(-6)}
                          </span>
                          <span class="text-white">
                            {formatAmount(nominator.value, getDecimals())} {getTokenSymbol()}
                          </span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Staking Information */}
        <Show when={stakingInfo()}>
          <div class="bg-gray-900 border border-gray-700 rounded p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Staking Details</h3>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-400">Bonded:</span>
                  <span class="text-white ml-2 font-mono">
                    {formatAmount(stakingInfo()!.bonded, getDecimals())} {getTokenSymbol()}
                  </span>
                </div>
                <div>
                  <span class="text-gray-400">Active:</span>
                  <span class="text-white ml-2 font-mono">
                    {formatAmount(stakingInfo()!.active, getDecimals())} {getTokenSymbol()}
                  </span>
                </div>
              </div>

              <div>
                <span class="text-gray-400">Payee:</span>
                <span class="text-white ml-2">{stakingInfo()!.payee}</span>
              </div>

              <Show when={stakingInfo()!.unlocking.length > 0}>
                <div>
                  <h4 class="text-sm text-gray-400 mb-2">Unlocking</h4>
                  <div class="space-y-1">
                    <For each={stakingInfo()!.unlocking}>
                      {(chunk) => (
                        <div class="flex justify-between text-xs">
                          <span class="text-gray-500">Era {chunk.era}</span>
                          <span class="text-white">
                            {formatAmount(chunk.value, getDecimals())} {getTokenSymbol()}
                          </span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              <Show when={BigInt(stakingInfo()!.redeemable) > 0n}>
                <div class="p-3 bg-green-900/20 border border-green-700 rounded">
                  <div class="flex justify-between items-center">
                    <span class="text-green-400">Redeemable:</span>
                    <span class="text-white font-mono">
                      {formatAmount(stakingInfo()!.redeemable, getDecimals())} {getTokenSymbol()}
                    </span>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Top Active Validators */}
        <Show when={activeValidators().length > 0}>
          <div class="bg-gray-900 border border-gray-700 rounded p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Top Active Validators</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-400 border-b border-gray-800">
                    <th class="pb-2">Address</th>
                    <th class="pb-2 text-right">Total Stake</th>
                    <th class="pb-2 text-right">Commission</th>
                    <th class="pb-2 text-right">Nominators</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={activeValidators()}>
                    {(validator) => (
                      <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                        <td class="py-2 font-mono text-xs text-gray-400">
                          {validator.address.slice(0, 8)}...{validator.address.slice(-6)}
                        </td>
                        <td class="py-2 text-right text-white">
                          {formatAmount(validator.total, getDecimals())}
                        </td>
                        <td class="py-2 text-right text-white">
                          {formatPercentage(validator.commission)}
                        </td>
                        <td class="py-2 text-right text-white">
                          {validator.nominators.length}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        </Show>

        {/* Minimum Requirements */}
        <Show when={minimums()}>
          <div class="bg-gray-900 border border-gray-700 rounded p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Minimum Requirements</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-400">Min Nominator:</span>
                <span class="text-white ml-2 font-mono">
                  {formatAmount(minimums().minNominatorBond, getDecimals())} {getTokenSymbol()}
                </span>
              </div>
              <div>
                <span class="text-gray-400">Min Validator:</span>
                <span class="text-white ml-2 font-mono">
                  {formatAmount(minimums().minValidatorBond, getDecimals())} {getTokenSymbol()}
                </span>
              </div>
              <div>
                <span class="text-gray-400">Min Active:</span>
                <span class="text-white ml-2 font-mono">
                  {formatAmount(minimums().minActiveStake, getDecimals())} {getTokenSymbol()}
                </span>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  )
}