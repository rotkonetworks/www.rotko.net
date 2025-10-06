import { Component, Show, createResource, Suspense } from 'solid-js'
import { usePolkadot } from '../../contexts/PolkadotProvider'
import type { InjectedAccountWithMeta, AccountInfo, StakingInfo } from '../../types/polkadot'

interface PowerAccountCardProps {
  account: InjectedAccountWithMeta
  selected: boolean
  expanded: boolean
  onToggleSelect: (address: string) => void
  onToggleExpand: (address: string) => void
  onQuickAction?: (action: string, account: InjectedAccountWithMeta) => void
  viewMode: 'grid' | 'list' | 'compact'
}

export const PowerAccountCard: Component<PowerAccountCardProps> = (props) => {
  const polkadot = usePolkadot()

  // Create resources for async data fetching
  const [accountInfo] = createResource(
    () => props.expanded && props.account.address,
    async (address) => {
      if (!address) return null
      return await polkadot.getAccountInfo(address)
    }
  )

  const [stakingInfo] = createResource(
    () => props.expanded && props.account.address,
    async (address) => {
      if (!address) return null
      return await polkadot.getStakingInfo(address)
    }
  )

  const formatBalance = (info: AccountInfo | null) => {
    if (!info) return null

    const chain = polkadot.selectedChain()
    const config = {
      polkadot: { decimals: 10, token: 'DOT' },
      kusama: { decimals: 12, token: 'KSM' },
      paseo: { decimals: 10, token: 'PAS' }
    }[chain]

    const divisor = BigInt(10 ** config.decimals)
    const free = Number(info.free / divisor) + Number((info.free % divisor) / divisor)
    const reserved = Number(info.reserved / divisor) + Number((info.reserved % divisor) / divisor)
    const frozen = Number(info.frozen / divisor) + Number((info.frozen % divisor) / divisor)

    return {
      free: free.toFixed(4),
      reserved: reserved.toFixed(4),
      frozen: frozen.toFixed(4),
      total: (free + reserved).toFixed(4),
      token: config.token
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(props.account.address)
  }

  const getAccountType = () => {
    const name = props.account.meta.name?.toLowerCase() || ''
    if (name.includes('validator')) return 'validator'
    if (name.includes('stash')) return 'stash'
    if (name.includes('nominator')) return 'nominator'
    if (name.includes('controller')) return 'controller'
    return 'standard'
  }

  const accountType = getAccountType()

  return (
    <div
      class={`
        ${props.viewMode === 'compact' ? 'p-2' : 'p-4'}
        bg-black border rounded transition-all
        ${props.selected
          ? 'border-cyan-400 shadow-lg shadow-cyan-400/20'
          : 'border-gray-700 hover:border-gray-600'}
      `}
    >
      <div class="flex items-start justify-between">
        {/* Checkbox and Basic Info */}
        <div class="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={props.selected}
            onChange={() => props.onToggleSelect(props.account.address)}
            class="mt-1 cursor-pointer"
          />
          <div class="flex-1">
            {/* Header with Name and Badges */}
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-sm text-cyan-400">
                {props.account.meta.name || 'Unnamed Account'}
              </span>

              {/* Type Badges */}
              <div class="flex gap-1">
                <Show when={accountType === 'validator'}>
                  <span class="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded">
                    Validator
                  </span>
                </Show>
                <Show when={accountType === 'stash'}>
                  <span class="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded">
                    Stash
                  </span>
                </Show>
                <Show when={accountType === 'nominator'}>
                  <span class="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded">
                    Nominator
                  </span>
                </Show>
                <Show when={accountType === 'controller'}>
                  <span class="px-2 py-0.5 bg-orange-900/30 text-orange-400 text-xs rounded">
                    Controller
                  </span>
                </Show>
              </div>

              {/* Status Indicators */}
              <Suspense>
                <Show when={stakingInfo()}>
                  {(info) => (
                    <>
                      <Show when={info().isActive}>
                        <span class="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded animate-pulse">
                          Active
                        </span>
                      </Show>
                      <Show when={info().isWaiting}>
                        <span class="px-2 py-0.5 bg-yellow-900/30 text-yellow-400 text-xs rounded">
                          Waiting
                        </span>
                      </Show>
                      <Show when={info().hasClaimableRewards}>
                        <span class="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-xs rounded">
                          Rewards Available
                        </span>
                      </Show>
                    </>
                  )}
                </Show>
              </Suspense>
            </div>

            {/* Address with Copy Button */}
            <div class="flex items-center gap-2 mt-1">
              <span class="font-mono text-xs text-gray-500">
                {formatAddress(props.account.address)}
              </span>
              <button
                onClick={copyAddress}
                class="text-gray-600 hover:text-cyan-400 transition-colors"
                title="Copy address"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>

            {/* Quick Balance Display (always visible in non-compact mode) */}
            <Show when={props.viewMode !== 'compact'}>
              <Suspense fallback={
                <div class="text-xs text-gray-600 mt-2 animate-pulse">Loading balance...</div>
              }>
                <Show when={accountInfo()}>
                  {(info) => {
                    const balance = formatBalance(info())
                    return (
                      <Show when={balance}>
                        <div class="text-xs text-gray-400 mt-2">
                          <span class="font-mono">{balance!.free}</span> {balance!.token}
                          <Show when={Number(balance!.reserved) > 0}>
                            <span class="text-gray-600"> • {balance!.reserved} reserved</span>
                          </Show>
                          <Show when={Number(balance!.frozen) > 0}>
                            <span class="text-gray-600"> • {balance!.frozen} frozen</span>
                          </Show>
                        </div>
                      </Show>
                    )
                  }}
                </Show>
              </Suspense>
            </Show>

            {/* Expanded Details */}
            <Show when={props.viewMode !== 'compact' && props.expanded}>
              <div class="mt-3 p-3 bg-gray-900 rounded">
                <Suspense fallback={
                  <div class="text-xs text-gray-600 animate-pulse">Loading details...</div>
                }>
                  {/* Balance Details */}
                  <Show when={accountInfo()}>
                    {(info) => {
                      const balance = formatBalance(info())
                      return (
                        <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span class="text-gray-400">Total Balance:</span>
                            <span class="text-white ml-2 font-mono">{balance!.total} {balance!.token}</span>
                          </div>
                          <div>
                            <span class="text-gray-400">Available:</span>
                            <span class="text-white ml-2 font-mono">{balance!.free} {balance!.token}</span>
                          </div>
                          <div>
                            <span class="text-gray-400">Reserved:</span>
                            <span class="text-white ml-2 font-mono">{balance!.reserved} {balance!.token}</span>
                          </div>
                          <div>
                            <span class="text-gray-400">Frozen:</span>
                            <span class="text-white ml-2 font-mono">{balance!.frozen} {balance!.token}</span>
                          </div>
                        </div>
                      )
                    }}
                  </Show>

                  {/* Staking Details */}
                  <Show when={stakingInfo()}>
                    {(info) => (
                      <div class="grid grid-cols-2 gap-2 text-xs mb-3 pt-3 border-t border-gray-800">
                        <Show when={info().bonded}>
                          <div>
                            <span class="text-gray-400">Bonded:</span>
                            <span class="text-white ml-2">{info().bonded}</span>
                          </div>
                        </Show>
                        <Show when={info().commission !== undefined}>
                          <div>
                            <span class="text-gray-400">Commission:</span>
                            <span class="text-white ml-2">{info().commission}%</span>
                          </div>
                        </Show>
                        <Show when={info().nominatorCount !== undefined}>
                          <div>
                            <span class="text-gray-400">Nominators:</span>
                            <span class="text-white ml-2">{info().nominatorCount}</span>
                          </div>
                        </Show>
                        <Show when={info().eraPoints !== undefined}>
                          <div>
                            <span class="text-gray-400">Era Points:</span>
                            <span class="text-white ml-2">{info().eraPoints}</span>
                          </div>
                        </Show>
                        <Show when={info().lastReward}>
                          <div>
                            <span class="text-gray-400">Last Reward:</span>
                            <span class="text-white ml-2">{info().lastReward}</span>
                          </div>
                        </Show>
                        <Show when={info().nextUnbonding}>
                          <div>
                            <span class="text-gray-400">Next Unbonding:</span>
                            <span class="text-white ml-2">{info().nextUnbonding}</span>
                          </div>
                        </Show>
                      </div>
                    )}
                  </Show>
                </Suspense>

                {/* Quick Actions */}
                <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-800">
                  <Show when={accountType === 'validator' || accountType === 'stash'}>
                    <button
                      class="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
                      onClick={() => props.onQuickAction?.('setKeys', props.account)}
                    >
                      Set Keys
                    </button>
                    <button
                      class="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
                      onClick={() => props.onQuickAction?.('bondMore', props.account)}
                    >
                      Bond More
                    </button>
                    <button
                      class="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
                      onClick={() => props.onQuickAction?.('unbond', props.account)}
                    >
                      Unbond
                    </button>
                  </Show>
                  <button
                    class="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
                    onClick={() => props.onQuickAction?.('claim', props.account)}
                  >
                    Claim Rewards
                  </button>
                  <Show when={accountType === 'validator'}>
                    <button
                      class="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                      onClick={() => props.onQuickAction?.('validate', props.account)}
                    >
                      Validate
                    </button>
                    <button
                      class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                      onClick={() => props.onQuickAction?.('chill', props.account)}
                    >
                      Chill
                    </button>
                  </Show>
                  <button
                    class="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                    onClick={() => props.onQuickAction?.('details', props.account)}
                  >
                    Full Details
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <Show when={props.viewMode !== 'compact'}>
          <button
            class="px-2 py-1 text-gray-400 hover:text-cyan-400 text-sm transition-colors"
            onClick={() => props.onToggleExpand(props.account.address)}
            title={props.expanded ? 'Collapse' : 'Expand'}
          >
            {props.expanded ? '▼' : '▶'}
          </button>
        </Show>
      </div>
    </div>
  )
}