export interface Network {
  id: string
  name: string
  description: string
  type: 'mainnet' | 'testnet' | 'canary'
  coingeckoId?: string
  stats: {
    apy: number
    uptime: number
    staked: number
  }
  price?: {
    current: number
    change24h: number
    change30d: number
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
    tagline: "AS142108 - Direct BGP to bare metal",
    description: "We run our own autonomous system. No middlemen, no markup, no excuses.",
    asn: "AS142108",
    location: "Bangkok, Thailand"
  },
  
  hero: {
    title: "Infra for resilient networks",
    subtitle: "Validators, RPC endpoints, and custom blockchain infrastructure. Built on our own AS, bare metal servers, and Linux expertise.",
    points: [
      "AS142108 with full BGP tables",
      "Direct peering, no transit markup",
      "Anycast routing to servers",
      "100% reproducible with NixOS"
    ]
  },
  
  infrastructure: {
    network: { value: "12Gbps", label: "Transit + Peering" },
    hardware: { value: "42U", label: "Dedicated Rack" },
    compute: { value: "728", label: "Physical Cores" },
    uptime: { value: "99.995%", label: "SLA Target" }
  },

  networks: [
    {
      id: "polkadot",
      name: "Polkadot",
      description: "Scalable heterogeneous multi-chain",
      type: "mainnet" as const,
      coingeckoId: "polkadot",
      stats: { apy: 12.2, uptime: 99.97, staked: 68 },
      price: { current: 0, change24h: 0, change30d: 0 }
    },
    {
      id: "kusama",
      name: "Kusama",
      description: "Most decentralized privacy network",
      type: "mainnet" as const,
      coingeckoId: "kusama",
      stats: { apy: 14.8, uptime: 99.96, staked: 45 },
      price: { current: 0, change24h: 0, change30d: 0 }
    },
    {
      id: "penumbra",
      name: "Penumbra",
      description: "End to end encrypted blockchain",
      type: "mainnet" as const,
      coingeckoId: "penumbra",
      stats: { apy: 9.34, uptime: 99.98, staked: 52 },
      price: { current: 0, change24h: 0, change30d: 0 }
    }
  ] as Network[],

  services: [
    {
      id: "rpc",
      name: "RPC Infrastructure",
      description: "Direct BGP to RPC nodes. No CDN, no proxy, just fast endpoints.",
      features: [
        "Full archive nodes",
        "WebSocket + HTTP/2",
        "Anycast failover",
        "Custom rate limits"
      ],
      status: "operational" as const,
      metrics: { requests24h: 2847293, latency: 12 }
    },
    {
      id: "validators",
      name: "Validator Operations",
      description: "We run validators. We don't get slashed. It's that simple.",
      features: [
        "Hardware security modules",
        "Geographic redundancy",
        "Automated key rotation",
        "Slash insurance available"
      ],
      status: "operational" as const
    },
    {
      id: "custom",
      name: "Custom Infrastructure",
      description: "Your hardware in our rack, or our hardware running your workload.",
      features: [
        "BGP to your servers",
        "IPMI/OOB access",
        "Remote hands 24/7",
        "DDoS protection included"
      ],
      status: "operational" as const
    }
  ] as Service[],

  sections: {
    services: "What we build",
    networks: "Active validators"
  },
  
  cta: {
    title: "Need infrastructure that works?",
    subtitle: "Talk to engineers, not sales.",
    button: "Connect on IRC"
  },

  navigation: [
    { label: "Infrastructure", href: "/infrastructure" },
    { label: "Services", href: "/services" },
    { label: "Software", href: "/software" },
    { label: "Team", href: "/team" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" }
  ],

  contact: {
    email: "noc@rotko.net",
    irc: {
      server: "irc.rotko.net",
      channel: "#rotko"
    }
  }
}
