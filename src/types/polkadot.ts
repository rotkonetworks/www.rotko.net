// Type definitions for Polkadot ecosystem
export interface InjectedAccountWithMeta {
  address: string
  meta: {
    genesisHash?: string | null
    name?: string
    source: string
  }
  type?: string
}

export interface InjectedExtension {
  enable: () => Promise<{
    accounts: {
      get: () => Promise<InjectedAccountWithMeta[]>
      subscribe: (cb: (accounts: InjectedAccountWithMeta[]) => void) => () => void
    }
    signer: any
  }>
  name: string
  version: string
}

export interface ChainConfig {
  name: string
  relay: string
  assetHub: string
  peopleChain: string
  stakingLocation: 'relay' | 'assetHub'  // Where staking operations are performed
  ss58: number
  decimals: number
  token: string
}

export interface ChainConnection {
  relay: any // ApiPromise
  assetHub: any // ApiPromise
  peopleChain: any // ApiPromise
}

export interface AccountInfo {
  free: bigint
  reserved: bigint
  frozen?: bigint
}

export interface StakingInfo {
  isStash: boolean
  isValidator: boolean
  isNominator: boolean
  bonded?: bigint
  redeemable?: bigint
  unlocking?: Array<{
    value: bigint
    era: number
  }>
}

export type ChainId = 'polkadot' | 'kusama' | 'paseo'

export interface WalletState {
  isConnected: boolean
  extension: string | null
  accounts: InjectedAccountWithMeta[]
  selectedAccount: InjectedAccountWithMeta | null
}

// Proxy types matching Polkadot's ProxyType enum
export type ProxyType = 'Any' | 'NonTransfer' | 'Governance' | 'Staking' | 'IdentityJudgement' | 'CancelProxy' | 'Auction'

export interface ProxyDefinition {
  delegate: string
  proxyType: ProxyType
  delay: number
}

export interface ProxyAccount {
  address: string
  delegator: string // The account that gave proxy rights
  proxyType: ProxyType
  delay: number
  nickname?: string
}