export interface Network {
  id: string
  name: string
  description: string
  type: 'mainnet' | 'testnet' | 'canary'
  stats: {
    apy: number
    uptime: number
    staked: number
  }
  price?: {
    current: number
    change24h: number
  }
}

export interface Service {
  id: string
  name: string
  description: string
  features: string[]
  status: 'operational' | 'degraded' | 'maintenance'
  metrics?: {
    requests24h: number
    latency: number
  }
}

export const siteData = {
  company: {
    name: "Rotko Networks",
    tagline: "Infrastructure that doesn't suck",
    description: "Hardware we control. Networks we own. Users who aren't products.",
    asn: "AS142108",
    location: "Southeast Asia"
  },
  
  infrastructure: {
    network: { value: "12G", label: "Network Capacity" },
    ram: { value: "3TB", label: "DDR4/DDR5 RAM" },
    cores: { value: "728", label: "vCPU Cores" },
    uptime: { value: "99.84%", label: "30-Day Uptime" }
  },

  networks: [
    {
      id: "polkadot",
      name: "Polkadot",
      description: "Enterprise blockchain",
      type: "mainnet" as const,
      stats: { apy: 14.2, uptime: 99.99, staked: 68 },
      price: { current: 7.45, change24h: 2.8 }
    },
    {
      id: "kusama",
      name: "Kusama",
      description: "Canary network",
      type: "canary" as const,
      stats: { apy: 16.8, uptime: 99.97, staked: 45 },
      price: { current: 28.92, change24h: -1.2 }
    },
    {
      id: "paseo",
      name: "Paseo",
      description: "Test environment",
      type: "testnet" as const,
      stats: { apy: 0, uptime: 99.98, staked: 0 }
    }
  ] as Network[],

  services: [
    {
      id: "rpc",
      name: "RPC Endpoints",
      description: "High-performance WebSocket and HTTP endpoints",
      features: ["Unlimited rate limits", "Archive nodes", "99.9% SLA"],
      status: "operational" as const,
      metrics: { requests24h: 2847293, latency: 45 }
    },
    {
      id: "staking",
      name: "Validator Services",
      description: "Professional staking infrastructure",
      features: ["Secure key management", "Automated failover", "Real-time monitoring"],
      status: "operational" as const
    }
  ] as Service[],

  navigation: [
    { label: "Networks", href: "/networks" },
    { label: "Endpoints", href: "/endpoints" },
    { label: "Resources", href: "/resources" },
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Team", href: "/team" }
  ],

  contact: {
    email: "hq@rotko.net",
    irc: {
      server: "wss://irc.rotko.net/webirc",
      channel: "#support"
    }
  }
}
