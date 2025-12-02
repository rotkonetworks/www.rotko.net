import { Component, Show, createMemo } from 'solid-js'
import type { ChainConfig } from '../../types/polkadot'
import type { AccountBalance, StakingData } from '../../services/multi-chain-service-papi'

interface StakingDashboardProps {
  config: ChainConfig
  balances: Map<string, AccountBalance>
  staking: Map<string, StakingData>
  currentEra: number | null
  connectionStatus: { relay: boolean; assetHub: boolean; peopleChain: boolean }
}

export const StakingDashboard: Component<StakingDashboardProps> = (props) => {
  const formatBalance = (value: bigint): string => {
    const divisor = 10n ** BigInt(props.config.decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 10000n / divisor).toString().padStart(4, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  const totals = createMemo(() => {
    let totalFree = 0n
    let totalBonded = 0n
    let totalActive = 0n
    let totalUnlocking = 0n
    let validators = 0
    let nominators = 0

    props.balances.forEach((balance) => {
      totalFree += balance.free
    })

    props.staking.forEach((staking) => {
      totalBonded += staking.bonded
      totalActive += staking.active
      staking.unlocking?.forEach(u => totalUnlocking += u.value)
      if (staking.validators && staking.validators.length > 0) validators++
      if (staking.nominators && staking.nominators.length > 0) nominators++
    })

    return { totalFree, totalBonded, totalActive, totalUnlocking, validators, nominators }
  })

  const isConnected = () => props.connectionStatus.relay || props.connectionStatus.assetHub

  return (
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Balance */}
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="text-xs text-gray-400 uppercase tracking-wide">Total Balance</div>
        <div class="text-xl font-mono text-white mt-1">
          {formatBalance(totals().totalFree)}
        </div>
        <div class="text-xs text-gray-500">{props.config.token}</div>
      </div>

      {/* Total Staked */}
      <div class="bg-gradient-to-br from-cyan-900/30 to-gray-900 border border-cyan-800/50 rounded-lg p-4">
        <div class="text-xs text-cyan-400 uppercase tracking-wide">Total Staked</div>
        <div class="text-xl font-mono text-cyan-300 mt-1">
          {formatBalance(totals().totalBonded)}
        </div>
        <div class="text-xs text-gray-500">{props.config.token}</div>
      </div>

      {/* Active Stake */}
      <div class="bg-gradient-to-br from-green-900/30 to-gray-900 border border-green-800/50 rounded-lg p-4">
        <div class="text-xs text-green-400 uppercase tracking-wide">Active Stake</div>
        <div class="text-xl font-mono text-green-300 mt-1">
          {formatBalance(totals().totalActive)}
        </div>
        <div class="text-xs text-gray-500">{props.config.token}</div>
      </div>

      {/* Unlocking */}
      <div class="bg-gradient-to-br from-yellow-900/30 to-gray-900 border border-yellow-800/50 rounded-lg p-4">
        <div class="text-xs text-yellow-400 uppercase tracking-wide">Unlocking</div>
        <div class="text-xl font-mono text-yellow-300 mt-1">
          {formatBalance(totals().totalUnlocking)}
        </div>
        <div class="text-xs text-gray-500">{props.config.token}</div>
      </div>

      {/* Era Info - spans full width on mobile */}
      <div class="col-span-2 lg:col-span-4 bg-gray-900/50 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
        <div class="flex items-center gap-6 text-sm">
          <Show when={props.currentEra}>
            <div>
              <span class="text-gray-500">Era</span>
              <span class="text-cyan-400 font-mono ml-2">{props.currentEra}</span>
            </div>
          </Show>
          <div>
            <span class="text-gray-500">Validators</span>
            <span class="text-green-400 font-mono ml-2">{totals().validators}</span>
          </div>
          <div>
            <span class="text-gray-500">Nominators</span>
            <span class="text-purple-400 font-mono ml-2">{totals().nominators}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${isConnected() ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span class="text-xs text-gray-400">
            {isConnected() ? props.config.name : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  )
}
