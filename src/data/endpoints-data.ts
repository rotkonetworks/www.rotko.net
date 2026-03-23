export interface EndpointProvider {
  name: string
  domain: string
  description: string
}

export const ENDPOINT_PROVIDERS: EndpointProvider[] = [
  { name: 'Direct', domain: 'rotko.net', description: 'Direct connection via AS142108' },
  { name: 'GeoDNS', domain: 'dotters.network', description: 'Global low-latency via IBP GeoDNS' },
]

export interface EndpointConfig {
  name: string
  slug: string
  type: 'relay' | 'assetHub' | 'people' | 'bridge' | 'collectives' | 'coretime' | 'evm' | 'parachain'
  description: string
  hostname?: string // override when hostname differs from slug (e.g. eth-revive-rpc)
  geodns?: boolean  // false = rotko.net only (default true)
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
      { name: 'Asset Hub', slug: 'asset-hub-polkadot', type: 'assetHub', description: 'Assets, staking, and smart contracts' },
      { name: 'EVM RPC (Asset Hub)', slug: 'eth-revive-rpc-polkadot', type: 'evm', description: 'Ethereum JSON-RPC for pallet-revive', hostname: 'eth-asset-hub-polkadot', geodns: false },
      { name: 'People Chain', slug: 'people-polkadot', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', slug: 'bridge-hub-polkadot', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Collectives', slug: 'collectives-polkadot', type: 'collectives', description: 'Fellowship and governance' },
      { name: 'Coretime', slug: 'coretime-polkadot', type: 'coretime', description: 'Coretime marketplace' },
      { name: 'Acala', slug: 'acala', type: 'parachain', description: 'DeFi hub parachain', geodns: false },
      { name: 'Ajuna', slug: 'ajuna', type: 'parachain', description: 'Gaming parachain', geodns: false },
      { name: 'Bifrost', slug: 'bifrost-polkadot', type: 'parachain', description: 'Liquid staking parachain', geodns: false },
      { name: 'Hydration', slug: 'hydration', type: 'parachain', description: 'Omnipool DEX', geodns: false },
      { name: 'Moonbeam', slug: 'moonbeam', type: 'parachain', description: 'EVM-compatible parachain', geodns: false },
      { name: 'Nexus', slug: 'nexus', type: 'parachain', description: 'Nexus parachain', geodns: false },
      { name: 'Unique', slug: 'unique', type: 'parachain', description: 'NFT parachain', geodns: false },
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
      { name: 'Asset Hub', slug: 'asset-hub-kusama', type: 'assetHub', description: 'Assets, staking, and smart contracts' },
      { name: 'EVM RPC (Asset Hub)', slug: 'eth-revive-rpc-kusama', type: 'evm', description: 'Ethereum JSON-RPC for pallet-revive', hostname: 'eth-asset-hub-kusama', geodns: false },
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
      { name: 'Asset Hub', slug: 'asset-hub-paseo', type: 'assetHub', description: 'Assets, staking, and smart contracts' },
      { name: 'EVM RPC (Asset Hub)', slug: 'eth-revive-rpc-paseo', type: 'evm', description: 'Ethereum JSON-RPC for pallet-revive', hostname: 'eth-asset-hub-paseo', geodns: false },
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

export const getHostname = (endpoint: EndpointConfig): string => {
  return endpoint.hostname || endpoint.slug
}

export const buildWssUrl = (endpoint: EndpointConfig, domain: string): string => {
  return `wss://${getHostname(endpoint)}.${domain}`
}

export const buildHttpsUrl = (endpoint: EndpointConfig, domain: string): string => {
  return `https://${getHostname(endpoint)}.${domain}`
}

// backwards compat
export const buildEndpointUrl = (slug: string, provider: 'dotters.network' | 'rotko.net'): string => {
  return `wss://${slug}.${provider}`
}
