import { ROTKO_VALIDATORS } from './validator-data'

export interface StakingNetwork {
  id: string
  name: string
  token: string
  validators: number
}

export interface EndpointNetwork {
  id: string
  name: string
  token: string
  description: string
}

export const STAKING_NETWORKS: StakingNetwork[] = [
  { id: 'polkadot', name: 'Polkadot', token: 'DOT', validators: ROTKO_VALIDATORS.polkadot?.length || 0 },
  { id: 'kusama', name: 'Kusama', token: 'KSM', validators: ROTKO_VALIDATORS.kusama?.length || 0 },
  { id: 'paseo', name: 'Paseo', token: 'PAS', validators: ROTKO_VALIDATORS.paseo?.length || 0 },
  { id: 'penumbra', name: 'Penumbra', token: 'UM', validators: ROTKO_VALIDATORS.penumbra?.length || 0 },
]

export const ENDPOINT_NETWORKS: EndpointNetwork[] = [
  { id: 'polkadot', name: 'Polkadot', token: 'DOT', description: 'Relay, system chains, and parachains' },
  { id: 'kusama', name: 'Kusama', token: 'KSM', description: 'Relay, system chains, and parachains' },
]

export interface Service {
  title: string
  description: string
  features: string[]
  iconClass: string
  gradient: string
  contact?: boolean
}

// The products we actually sell, revenue-first. Shared by the homepage and the
// services page so they never drift.
export interface Offering {
  title: string
  desc: string
  href: string
  icon: string
  price: string
  cta: string
}

export const OFFERINGS: Offering[] = [
  {
    title: 'VM Hosting',
    desc: 'KVM virtual machines on PCIe 4.0 NVMe, IPv6-first and routed on AS142108. Deploy in minutes.',
    href: '/hosting',
    icon: 'i-mdi-cloud-outline',
    price: 'from $3/mo',
    cta: 'Deploy a VM',
  },
  {
    title: 'Bare Metal',
    desc: 'Rent a dedicated EPYC or Ryzen server in our rack, single-tenant, 1-3 day delivery in Asia. No hardware to ship.',
    href: '/colocation',
    icon: 'i-mdi-server',
    price: 'from $350/mo',
    cta: 'See servers',
  },
  {
    title: 'Colocation',
    desc: 'Your own hardware in our Bangkok rack, direct BGP, redundant power, and your own IPv4/IPv6 space.',
    href: '/colocation',
    icon: 'i-mdi-server-network',
    price: 'from $45/U·mo',
    cta: 'Build & price',
  },
  {
    title: 'Staking',
    desc: 'Stake DOT with our Bangkok bare-metal validators — join the nomination pool from 1 DOT, or run your stake as a validator. Non-custodial.',
    href: '/services/staking',
    icon: 'i-mdi-chart-line-variant',
    price: 'from 1 DOT',
    cta: 'Stake DOT',
  },
  {
    title: 'RPC Endpoints',
    desc: 'Full-archive WSS / HTTPS / gRPC across the Polkadot ecosystem and Penumbra. Public, or dedicated whitelabel.',
    href: '/services/endpoints',
    icon: 'i-mdi-lightning-bolt',
    price: 'public & whitelabel',
    cta: 'View endpoints',
  },
  {
    title: 'Network engineering',
    desc: 'BGP, peering and routing configuration, plus infrastructure architecture, audits and disaster-recovery design.',
    href: '/contact',
    icon: 'i-mdi-lan',
    price: 'consulting',
    cta: 'Discuss your project',
  },
]

export interface ServiceStat {
  value: string
  label: string
}

export const servicesData = {
  hero: {
    title: "Infrastructure services",
    subtitle: "Hosting, colocation, RPC and the network engineering behind them, on our own AS142108 and bare metal in Bangkok.",
    description: "Deploy a VM, colocate your hardware, connect to archive RPC, or have us run it for you."
  },

  services: [
    {
      title: "Staking Services",
      description: "Professional validator operations for Proof-of-Stake networks with enterprise-grade infrastructure and monitoring.",
      features: [
        "99.95% uptime guarantee",
        "Redundant infrastructure across multiple regions",
        "24/7 monitoring and alerting",
        "Automated failover systems",
        "Secure key management with HSM",
        "Real-time performance dashboards"
      ],
      iconClass: "i-mdi-shield-lock",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "RPC Endpoints",
      description: "High-performance, reliable RPC endpoints for blockchain applications with low latency and high throughput.",
      features: [
        "WebSocket and HTTP/HTTPS support",
        "Load-balanced infrastructure",
        "Geographic distribution for low latency",
        "Rate limiting and DDoS protection",
        "Archive node access",
        "Custom endpoint configuration"
      ],
      iconClass: "i-mdi-lightning-bolt",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      title: "Archive Nodes",
      description: "Full historical blockchain data access for analytics, forensics, and compliance requirements.",
      features: [
        "Complete transaction history",
        "State snapshots at any block",
        "Fast historical queries",
        "Pruned and full archive options",
        "Dedicated resources",
        "Custom indexing available"
      ],
      iconClass: "i-mdi-bookshelf",
      gradient: "from-orange-600 to-red-600"
    },
    {
      title: "Private Networks",
      description: "Deploy and manage private blockchain networks for testing, development, or production use cases.",
      features: [
        "Custom chain configurations",
        "Isolated network environment",
        "Full node management",
        "Genesis block configuration",
        "Validator set management",
        "Network monitoring dashboard"
      ],
      iconClass: "i-mdi-lock",
      gradient: "from-indigo-600 to-purple-600"
    },
    {
      title: "Consulting Services",
      description: "Expert guidance on blockchain infrastructure, networking, security, and best practices for your project.",
      features: [
        "Network configuration: BGP, peering & routing",
        "Infrastructure architecture design",
        "Security audits and reviews",
        "Performance optimization",
        "Disaster recovery planning",
        "Custom solution development"
      ],
      iconClass: "i-mdi-lightbulb",
      gradient: "from-yellow-600 to-orange-600",
      contact: true
    }
  ],

  networks: [
    "Polkadot",
    "Kusama",
    "Paseo",
    "Penumbra",
    "Substrate Parachains"
  ],

  stats: [
    {
      value: "99.9%",
      label: "Uptime (30d)"
    },
    {
      value: "4",
      label: "Networks"
    },
    {
      value: "11",
      label: "Validators"
    },
    {
      value: "24/7",
      label: "Monitoring"
    }
  ],

  cta: {
    title: "Ready to Get Started?",
    description: "Contact us to discuss your infrastructure needs and get a custom solution tailored for your project",
    primaryButton: {
      text: "Contact Us",
      href: "/contact"
    },
    secondaryButton: {
      text: "View on GitHub",
      href: "https://github.com/rotkonetworks"
    }
  }
}