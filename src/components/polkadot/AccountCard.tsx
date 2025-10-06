import { Component, Show, createResource, Suspense } from 'solid-js'
import { usePolkadot } from '../../contexts/PolkadotProvider'
import type { InjectedAccountWithMeta, AccountInfo, StakingInfo } from '../../types/polkadot'

interface AccountCardProps {
  account: InjectedAccountWithMeta
  onClick?: (account: InjectedAccountWithMeta) => void
  selected?: boolean
  showBalance?: boolean
  showStakingInfo?: boolean
  actionButton?: {
    label: string
    onClick: (account: InjectedAccountWithMeta) => void
  }
}

export const AccountCard: Component<AccountCardProps> = (props) => {
  const polkadot = usePolkadot()

  // Create resources for async data fetching
  const [accountInfo] = createResource(
    () => props.showBalance && props.account.address,
    async (address) => {
      if (!address) return null
      return await polkadot.getAccountInfo(address)
    }
  )

  const [stakingInfo] = createResource(
    () => props.showStakingInfo && props.account.address,
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

    return {
      free: free.toFixed(4),
      reserved: reserved.toFixed(4),
      token: config.token
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  return (
    <div
      class={`p-4 bg-black border rounded transition-all ${
        props.selected
          ? 'border-cyan-400 shadow-lg shadow-cyan-400/20'
          : 'border-gray-700 hover:border-gray-600'
      } ${props.onClick ? 'cursor-pointer' : ''}`}
      onClick={() => props.onClick?.(props.account)}
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="font-mono text-sm text-cyan-400">{props.account.meta.name}</div>
          <div class="font-mono text-xs text-gray-500 mt-1">
            {formatAddress(props.account.address)}
          </div>

          <Suspense fallback={<div class="text-xs text-gray-600 mt-2">Loading...</div>}>
            <Show when={props.showBalance && accountInfo()}>
              {(info) => {
                const balance = formatBalance(info())
                return (
                  <Show when={balance}>
                    <div class="text-xs text-gray-400 mt-2">
                      {balance!.free} {balance!.token}
                      <Show when={Number(balance!.reserved) > 0}>
                        <span class="text-gray-600"> ({balance!.reserved} reserved)</span>
                      </Show>
                    </div>
                  </Show>
                )
              }}
            </Show>

            <Show when={props.showStakingInfo && stakingInfo()}>
              {(info) => (
                <div class="flex gap-2 mt-2">
                  <Show when={info().isValidator}>
                    <span class="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                      Validating
                    </span>
                  </Show>
                  <Show when={info().isStash}>
                    <span class="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">
                      Stash
                    </span>
                  </Show>
                  <Show when={info().isNominator}>
                    <span class="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                      Nominating
                    </span>
                  </Show>
                </div>
              )}
            </Show>
          </Suspense>
        </div>

        <Show when={props.actionButton}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              props.actionButton!.onClick(props.account)
            }}
            class="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm ml-4"
          >
            {props.actionButton!.label}
          </button>
        </Show>
      </div>
    </div>
  )
}