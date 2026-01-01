export interface EndpointProvider {
  name: string
  domain: string
  description: string
}

export const ENDPOINT_PROVIDERS: EndpointProvider[] = [
  { name: 'GeoDNS', domain: 'dotters.network', description: 'Global low-latency via IBP GeoDNS' },
  { name: 'Direct', domain: 'rotko.net', description: 'Direct connection to Rotko infrastructure' },
]

export interface EndpointConfig {
  name: string
  slug: string
  type: 'relay' | 'assetHub' | 'people' | 'bridge' | 'collectives' | 'coretime' | 'parachain'
  description: string
}

export interface ChainConfig {
  name: string
  endpoints: EndpointConfig[]
  ss58: number
  decimals: number
  token: string
  color: string
}

export const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    endpoints: [
      { name: 'Relay Chain', slug: 'polkadot', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', slug: 'asset-hub-polkadot', type: 'assetHub', description: 'Assets, staking, and system parachains' },
      { name: 'People Chain', slug: 'people-polkadot', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', slug: 'bridge-hub-polkadot', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Collectives', slug: 'collectives-polkadot', type: 'collectives', description: 'Fellowship and governance' },
      { name: 'Coretime', slug: 'coretime-polkadot', type: 'coretime', description: 'Coretime marketplace' },
      { name: 'Acala', slug: 'acala', type: 'parachain', description: 'DeFi hub parachain' },
      { name: 'Ajuna', slug: 'ajuna', type: 'parachain', description: 'Gaming parachain' },
      { name: 'Bifrost', slug: 'bifrost-polkadot', type: 'parachain', description: 'Liquid staking parachain' },
      { name: 'Hydration', slug: 'hydration', type: 'parachain', description: 'Omnipool DEX' },
      { name: 'KILT', slug: 'kilt', type: 'parachain', description: 'Identity credentials' },
      { name: 'Moonbeam', slug: 'moonbeam', type: 'parachain', description: 'EVM-compatible parachain' },
      { name: 'Polimec', slug: 'polimec', type: 'parachain', description: 'Fundraising protocol' },
      { name: 'Unique', slug: 'unique', type: 'parachain', description: 'NFT parachain' },
    ],
    ss58: 0,
    decimals: 10,
    token: 'DOT',
    color: 'pink'
  },
  kusama: {
    name: 'Kusama',
    endpoints: [
      { name: 'Relay Chain', slug: 'kusama', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', slug: 'asset-hub-kusama', type: 'assetHub', description: 'Assets, staking, and system parachains' },
      { name: 'People Chain', slug: 'people-kusama', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', slug: 'bridge-hub-kusama', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Coretime', slug: 'coretime-kusama', type: 'coretime', description: 'Coretime marketplace' },
      { name: 'Encointer', slug: 'encointer-kusama', type: 'parachain', description: 'Encointer parachain' },
    ],
    ss58: 2,
    decimals: 12,
    token: 'KSM',
    color: 'gray'
  },
  paseo: {
    name: 'Paseo',
    endpoints: [
      { name: 'Relay Chain', slug: 'paseo', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', slug: 'asset-hub-paseo', type: 'assetHub', description: 'Assets, staking, and system parachains' },
      { name: 'People Chain', slug: 'people-paseo', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', slug: 'bridge-hub-paseo', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Coretime', slug: 'coretime-paseo', type: 'coretime', description: 'Coretime marketplace' },
    ],
    ss58: 0,
    decimals: 10,
    token: 'PAS',
    color: 'green'
  }
}

export const buildEndpointUrl = (slug: string, provider: 'dotters.network' | 'rotko.net'): string => {
  return `wss://${slug}.${provider}`
}
