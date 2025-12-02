import { Component, Show, createMemo } from 'solid-js'
import type { InjectedAccountWithMeta, ChainConfig } from '../../types/polkadot'
import type { AccountBalance, StakingData } from '../../services/multi-chain-service-papi'

interface StakingAccountCardProps {
  account: InjectedAccountWithMeta
  balance?: AccountBalance
  staking?: StakingData
  config: ChainConfig
  formatAddress: (address: string) => string
  onAction: (action: string, account: InjectedAccountWithMeta) => void
  onCopy: (address: string) => void
  copied: boolean
}

export const StakingAccountCard: Component<StakingAccountCardProps> = (props) => {
  const formatBalance = (value: bigint): string => {
    const divisor = 10n ** BigInt(props.config.decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 10000n / divisor).toString().padStart(4, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  // Detect actual staking role from chain state
  const stakingRole = createMemo(() => {
    const staking = props.staking
    if (!staking) return 'none'

    // Has validators set = is a validator
    if (staking.validators && staking.validators.length > 0) return 'validator'

    // Has nominators/targets = is nominating
    if (staking.nominators && staking.nominators.length > 0) return 'nominator'

    // Has bonded funds but not validating/nominating = bonded idle
    if (staking.bonded > 0n) return 'bonded'

    return 'none'
  })

  const roleConfig = createMemo(() => {
    const role = stakingRole()
    switch (role) {
      case 'validator':
        return { label: 'Validator', color: 'green', bg: 'bg-green-900/20', border: 'border-green-700/50' }
      case 'nominator':
        return { label: 'Nominator', color: 'purple', bg: 'bg-purple-900/20', border: 'border-purple-700/50' }
      case 'bonded':
        return { label: 'Bonded', color: 'blue', bg: 'bg-blue-900/20', border: 'border-blue-700/50' }
      default:
        return { label: 'Unbonded', color: 'gray', bg: 'bg-gray-900', border: 'border-gray-700' }
    }
  })

  const unlockingTotal = createMemo(() => {
    if (!props.staking?.unlocking) return 0n
    return props.staking.unlocking.reduce((sum, u) => sum + u.value, 0n)
  })

  const hasUnclaimedRewards = () => (props.staking?.unclaimedEras?.length || 0) > 0

  // Quick actions based on role
  const quickActions = createMemo(() => {
    const role = stakingRole()
    const actions = []

    if (role === 'validator') {
      actions.push({ id: 'setKeys', label: 'Keys', icon: '🔑' })
      actions.push({ id: 'chill', label: 'Chill', icon: '❄️' })
    } else if (role === 'nominator') {
      actions.push({ id: 'nominate', label: 'Edit', icon: '✏️' })
      actions.push({ id: 'chill', label: 'Stop', icon: '⏹️' })
    } else if (role === 'bonded') {
      actions.push({ id: 'validate', label: 'Validate', icon: '✓' })
      actions.push({ id: 'nominate', label: 'Nominate', icon: '📋' })
    } else {
      actions.push({ id: 'bond', label: 'Bond', icon: '🔗' })
    }

    if (props.staking?.bonded && props.staking.bonded > 0n) {
      actions.push({ id: 'unbond', label: 'Unbond', icon: '🔓' })
    }

    if (unlockingTotal() > 0n) {
      actions.push({ id: 'withdrawUnbonded', label: 'Withdraw', icon: '💰' })
    }

    if (hasUnclaimedRewards()) {
      actions.push({ id: 'claim', label: 'Claim', icon: '🎁', highlight: true })
    }

    return actions
  })

  return (
    <div class={`${roleConfig().bg} border ${roleConfig().border} rounded-lg overflow-hidden transition-all hover:shadow-lg`}>
      {/* Header */}
      <div class="p-4 flex items-start justify-between">
        <div class="flex-1 min-w-0">
          {/* Name and Role */}
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-white truncate">
              {props.account.meta.name || 'Unnamed'}
            </span>
            <span class={`px-2 py-0.5 text-xs rounded bg-${roleConfig().color}-900/50 text-${roleConfig().color}-400`}>
              {roleConfig().label}
            </span>
            <Show when={hasUnclaimedRewards()}>
              <span class="px-2 py-0.5 text-xs rounded bg-yellow-900/50 text-yellow-400 animate-pulse">
                {props.staking?.unclaimedEras?.length} unclaimed
              </span>
            </Show>
          </div>

          {/* Address */}
          <div class="flex items-center gap-2 mt-1">
            <span class="font-mono text-xs text-gray-500 truncate">
              {props.formatAddress(props.account.address)}
            </span>
            <button
              onClick={() => props.onCopy(props.formatAddress(props.account.address))}
              class="text-gray-500 hover:text-cyan-400 transition-colors flex-shrink-0"
            >
              <Show when={props.copied} fallback={
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }>
                <svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </Show>
            </button>
          </div>
        </div>

        {/* Source badge */}
        <span class="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">
          {props.account.meta.source}
        </span>
      </div>

      {/* Balance Grid */}
      <div class="px-4 pb-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <div class="text-xs text-gray-500">Available</div>
          <div class="font-mono text-sm text-white">
            {props.balance ? formatBalance(props.balance.free) : '—'}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500">Bonded</div>
          <div class={`font-mono text-sm ${props.staking?.bonded && props.staking.bonded > 0n ? 'text-cyan-400' : 'text-gray-600'}`}>
            {props.staking ? formatBalance(props.staking.bonded) : '—'}
          </div>
        </div>
        <Show when={props.staking?.active && props.staking.active > 0n}>
          <div>
            <div class="text-xs text-gray-500">Active</div>
            <div class="font-mono text-sm text-green-400">
              {formatBalance(props.staking!.active)}
            </div>
          </div>
        </Show>
        <Show when={unlockingTotal() > 0n}>
          <div>
            <div class="text-xs text-gray-500">Unlocking</div>
            <div class="font-mono text-sm text-yellow-400">
              {formatBalance(unlockingTotal())}
            </div>
          </div>
        </Show>
      </div>

      {/* Additional Info for active stakers */}
      <Show when={stakingRole() === 'validator' || stakingRole() === 'nominator'}>
        <div class="px-4 pb-3 flex items-center gap-4 text-xs">
          <Show when={props.staking?.commission !== undefined}>
            <span class="text-gray-500">
              Commission: <span class="text-white">{(props.staking!.commission! / 10000000).toFixed(1)}%</span>
            </span>
          </Show>
          <Show when={props.staking?.nominators}>
            <span class="text-gray-500">
              Nominating: <span class="text-purple-400">{props.staking!.nominators!.length} validators</span>
            </span>
          </Show>
          <Show when={props.staking?.rewardDestination}>
            <span class="text-gray-500">
              Rewards → <span class="text-cyan-400">{props.staking!.rewardDestination}</span>
            </span>
          </Show>
        </div>
      </Show>

      {/* Quick Actions */}
      <div class="border-t border-gray-800 p-2 flex flex-wrap gap-1">
        {quickActions().map((action) => (
          <button
            class={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              action.highlight
                ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            onClick={() => props.onAction(action.id, props.account)}
          >
            <span class="mr-1">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
