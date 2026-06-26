export interface EndpointProvider {
  name: string
  domain: string
  description: string
}

export const ENDPOINT_PROVIDERS: EndpointProvider[] = [
  { name: 'Direct', domain: 'rotko.net', description: 'Direct connection via AS142108' },
  { name: 'GeoDNS', domain: 'dotters.network', description: 'Global low-latency via IBP GeoDNS' },
]

// Protocol family for an endpoint. Drives which URL rows and usage
// snippets a card renders.
//   substrate, JSON-RPC over WSS + HTTPS (Polkadot SDK chains)
//   evm      , Ethereum JSON-RPC (pallet-revive on Asset Hub)
//   penumbra , pd gRPC (gRPC-web over HTTPS), used by pcli / Prax
//   zcash    , lightwalletd gRPC
//   rpc      , generic JSON-RPC over HTTPS (Bitcoin/Doge/XRP-style L1 nodes)
export type EndpointKind = 'substrate' | 'evm' | 'penumbra' | 'zcash' | 'rpc'

export type EndpointType =
  | 'relay' | 'assetHub' | 'people' | 'bridge' | 'collectives'
  | 'coretime' | 'evm' | 'parachain' | 'sovereign'

export interface EndpointConfig {
  name: string
  slug: string
  type: EndpointType
  description: string
  kind?: EndpointKind // default 'substrate'
  hostname?: string   // override when hostname differs from slug (e.g. eth-revive-rpc)
  aliases?: string[]  // additional hostnames that resolve to the same endpoint
  rpcMethod?: string  // method shown in the generic JSON-RPC curl example (kind 'rpc')
  geodns?: boolean    // false = rotko.net only (default true)
  health?: boolean    // false = not tracked in gatus (default true)
  infoUrl?: string    // "Learn more" link to the chain's canonical site
}

export interface ChainConfig {
  /** Short id used as the ecosystem tab/section heading. */
  name: string
  /** One-line positioning blurb shown under the section heading. */
  blurb: string
  endpoints: EndpointConfig[]
  ss58: number
  decimals: number
  token: string
  color: string
}

export const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    blurb: 'Production relay and system chains. Asset Hub carries balances, assets, NFTs and smart contracts; the relay is consensus-only.',
    endpoints: [
      { name: 'Relay Chain', slug: 'polkadot', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', slug: 'asset-hub-polkadot', type: 'assetHub', description: 'Assets, staking, and smart contracts' },
      { name: 'EVM RPC (Asset Hub)', slug: 'eth-revive-rpc-polkadot', type: 'evm', kind: 'evm', description: 'Ethereum JSON-RPC for pallet-revive', hostname: 'eth-asset-hub-polkadot', geodns: false },
      { name: 'People Chain', slug: 'people-polkadot', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', slug: 'bridge-hub-polkadot', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Collectives', slug: 'collectives-polkadot', type: 'collectives', description: 'Fellowship and governance' },
      { name: 'Coretime', slug: 'coretime-polkadot', type: 'coretime', description: 'Coretime marketplace' },
    ],
    ss58: 0,
    decimals: 10,
    token: 'DOT',
    color: 'pink'
  },
  kusama: {
    name: 'Kusama',
    blurb: 'Polkadot’s canary network, same code, real economic value, faster governance and upgrade cadence.',
    endpoints: [
      { name: 'Relay Chain', slug: 'kusama', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', slug: 'asset-hub-kusama', type: 'assetHub', description: 'Assets, staking, and smart contracts' },
      { name: 'EVM RPC (Asset Hub)', slug: 'eth-revive-rpc-kusama', type: 'evm', kind: 'evm', description: 'Ethereum JSON-RPC for pallet-revive', hostname: 'eth-asset-hub-kusama', geodns: false },
      { name: 'People Chain', slug: 'people-kusama', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', slug: 'bridge-hub-kusama', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Coretime', slug: 'coretime-kusama', type: 'coretime', description: 'Coretime marketplace' },
    ],
    ss58: 2,
    decimals: 12,
    token: 'KSM',
    color: 'gray'
  },
  penumbra: {
    name: 'Penumbra',
    blurb: 'Fully private proof-of-stake, shielded transactions and staking. Served over pd’s gRPC for pcli, Prax, and the view service.',
    endpoints: [
      { name: 'Penumbra Mainnet', slug: 'penumbra', type: 'sovereign', kind: 'penumbra', description: 'pd gRPC endpoint for pcli, Prax wallet and view services', geodns: false, health: false, infoUrl: 'https://penumbra.zone' },
    ],
    ss58: 0,
    decimals: 6,
    token: 'UM',
    color: 'purple'
  },
  /* Not yet live as public RPC — node/DNS/proxy pending. Uncomment to publish.
  hyperliquid: {
    name: 'Hyperliquid',
    blurb: 'High-performance EVM (HyperEVM) RPC, fast, archive, no key. Point your wallet, indexer or bot at *.rotko.net.',
    endpoints: [
      { name: 'HyperEVM RPC', slug: 'hyperliquid', type: 'evm', kind: 'evm', description: 'Ethereum JSON-RPC for HyperEVM', aliases: ['hype'], geodns: false, health: false, infoUrl: 'https://hyperliquid.xyz' },
    ],
    ss58: 0,
    decimals: 18,
    token: 'HYPE',
    color: 'green'
  },
  */
  hydration: {
    name: 'Hydration',
    blurb: 'Polkadot’s omnipool DEX and money market. Archive WebSocket + HTTPS RPC under *.rotko.net.',
    endpoints: [
      { name: 'Hydration RPC', slug: 'hydration', type: 'parachain', description: 'Omnipool DEX and money market', geodns: false, infoUrl: 'https://hydration.net' },
    ],
    ss58: 63,
    decimals: 12,
    token: 'HDX',
    color: 'cyan'
  },
  /* Not yet live as public RPC — nodes/DNS/proxy pending. Uncomment per chain
     as each goes live (confirm the hostname resolves and the proxy routes it).
  zcash: {
    name: 'Zcash',
    blurb: 'The original shielded chain. lightwalletd gRPC for Zcash wallets and indexers, privacy-first, like Penumbra.',
    endpoints: [
      { name: 'lightwalletd', slug: 'zcash', type: 'sovereign', kind: 'zcash', description: 'lightwalletd gRPC for wallets (Zashi, Ywallet) and indexers', geodns: false, health: false, infoUrl: 'https://z.cash' },
    ],
    ss58: 0,
    decimals: 8,
    token: 'ZEC',
    color: 'yellow'
  },
  ethereum: {
    name: 'Ethereum',
    blurb: 'Full Ethereum execution RPC. JSON-RPC over HTTPS for wallets, indexers and bots.',
    endpoints: [
      { name: 'Ethereum RPC', slug: 'eth', type: 'sovereign', kind: 'evm', description: 'Ethereum mainnet JSON-RPC', aliases: ['ethereum'], geodns: false, health: false, infoUrl: 'https://ethereum.org' },
    ],
    ss58: 0,
    decimals: 18,
    token: 'ETH',
    color: 'gray'
  },
  bitcoin: {
    name: 'Bitcoin',
    blurb: 'Bitcoin Core full node. JSON-RPC for wallets, explorers and settlement.',
    endpoints: [
      { name: 'Bitcoin RPC', slug: 'btc', type: 'sovereign', kind: 'rpc', description: 'Bitcoin Core JSON-RPC', aliases: ['bitcoin'], geodns: false, health: false, infoUrl: 'https://bitcoin.org' },
    ],
    ss58: 0,
    decimals: 8,
    token: 'BTC',
    color: 'orange'
  },
  dogecoin: {
    name: 'Dogecoin',
    blurb: 'Dogecoin Core full node. JSON-RPC over HTTPS.',
    endpoints: [
      { name: 'Dogecoin RPC', slug: 'doge', type: 'sovereign', kind: 'rpc', description: 'Dogecoin Core JSON-RPC', geodns: false, health: false, infoUrl: 'https://dogecoin.com' },
    ],
    ss58: 0,
    decimals: 8,
    token: 'DOGE',
    color: 'yellow'
  },
  xrp: {
    name: 'XRP Ledger',
    blurb: 'XRP Ledger full node. JSON-RPC / WebSocket for wallets and payments.',
    endpoints: [
      { name: 'XRPL RPC', slug: 'xrp', type: 'sovereign', kind: 'rpc', description: 'XRP Ledger JSON-RPC', rpcMethod: 'server_info', geodns: false, health: false, infoUrl: 'https://xrpl.org' },
    ],
    ss58: 0,
    decimals: 6,
    token: 'XRP',
    color: 'cyan'
  },
  solana: {
    name: 'Solana',
    blurb: 'Solana full node. JSON-RPC over HTTPS for wallets, indexers and programs.',
    endpoints: [
      { name: 'Solana RPC', slug: 'solana', type: 'sovereign', kind: 'rpc', description: 'Solana JSON-RPC', aliases: ['sol'], rpcMethod: 'getHealth', geodns: false, health: false, infoUrl: 'https://solana.com' },
    ],
    ss58: 0,
    decimals: 9,
    token: 'SOL',
    color: 'purple'
  },
  near: {
    name: 'NEAR',
    blurb: 'NEAR Protocol full node. JSON-RPC over HTTPS for wallets and dApps.',
    endpoints: [
      { name: 'NEAR RPC', slug: 'near', type: 'sovereign', kind: 'rpc', description: 'NEAR JSON-RPC', rpcMethod: 'status', geodns: false, health: false, infoUrl: 'https://near.org' },
    ],
    ss58: 0,
    decimals: 24,
    token: 'NEAR',
    color: 'gray'
  },
  arbitrum: {
    name: 'Arbitrum',
    blurb: 'Arbitrum One execution RPC. Ethereum JSON-RPC for the leading L2.',
    endpoints: [
      { name: 'Arbitrum RPC', slug: 'arbitrum', type: 'evm', kind: 'evm', description: 'Arbitrum One JSON-RPC', aliases: ['arb'], geodns: false, health: false, infoUrl: 'https://arbitrum.io' },
    ],
    ss58: 0,
    decimals: 18,
    token: 'ETH',
    color: 'cyan'
  },
  base: {
    name: 'Base',
    blurb: 'Base execution RPC. Ethereum JSON-RPC for Coinbase’s L2.',
    endpoints: [
      { name: 'Base RPC', slug: 'base', type: 'evm', kind: 'evm', description: 'Base mainnet JSON-RPC', geodns: false, health: false, infoUrl: 'https://base.org' },
    ],
    ss58: 0,
    decimals: 18,
    token: 'ETH',
    color: 'blue'
  },
  */
}

export const getHostname = (endpoint: EndpointConfig): string => {
  return endpoint.hostname || endpoint.slug
}

export const getKind = (endpoint: EndpointConfig): EndpointKind => {
  return endpoint.kind || 'substrate'
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
