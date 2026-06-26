export interface StakingChainConfig {
  name: string
  assetHub: string
  relay: string
  ss58: number
  decimals: number
  token: string
  subscan: string
  color: string
  stakingType: 'substrate' | 'penumbra'
}

export const STAKING_CHAINS: Record<string, StakingChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    assetHub: 'wss://asset-hub-polkadot.rotko.net',
    relay: 'wss://polkadot.rotko.net',
    ss58: 0,
    decimals: 10,
    token: 'DOT',
    subscan: 'https://polkadot.subscan.io',
    color: 'pink',
    stakingType: 'substrate'
  },
  kusama: {
    name: 'Kusama',
    assetHub: 'wss://asset-hub-kusama.rotko.net',
    relay: 'wss://kusama.rotko.net',
    ss58: 2,
    decimals: 12,
    token: 'KSM',
    subscan: 'https://kusama.subscan.io',
    color: 'gray',
    stakingType: 'substrate'
  },
  paseo: {
    name: 'Paseo',
    assetHub: 'wss://asset-hub-paseo.rotko.net',
    relay: 'wss://paseo.rotko.net',
    ss58: 0,
    decimals: 10,
    token: 'PAS',
    subscan: 'https://paseo.subscan.io',
    color: 'green',
    stakingType: 'substrate'
  },
  penumbra: {
    name: 'Penumbra',
    assetHub: '',
    relay: '',
    ss58: 0,
    decimals: 6,
    token: 'UM',
    subscan: 'https://explorer.penumbra.zone',
    color: 'purple',
    stakingType: 'penumbra'
  }
}
