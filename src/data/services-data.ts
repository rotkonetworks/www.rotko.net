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
  { id: 'paseo', name: 'Paseo', token: 'PAS', description: 'Relay and system chains' },
]

export interface Service {
  title: string
  description: string
  features: string[]
  iconClass: string
  gradient: string
}

export interface ServiceStat {
  value: string
  label: string
}

export const servicesData = {
  hero: {
    title: "Infrastructure Services",
    subtitle: "Enterprise-grade blockchain infrastructure powering the decentralized web",
    description: "Professional validator operations, high-performance RPC endpoints, and essential network bootstrap nodes with guaranteed uptime and security."
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
      title: "Boot Nodes",
      description: "Essential network bootstrap nodes ensuring reliable peer discovery and network connectivity.",
      features: [
        "High availability boot nodes",
        "Geographic distribution",
        "Optimized peer discovery",
        "Network health monitoring",
        "Custom network support",
        "Private network setup"
      ],
      iconClass: "i-mdi-web",
      gradient: "from-green-600 to-teal-600"
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
      description: "Expert guidance on blockchain infrastructure, security, and best practices for your project.",
      features: [
        "Infrastructure architecture design",
        "Security audits and reviews",
        "Performance optimization",
        "Disaster recovery planning",
        "Team training and workshops",
        "Custom solution development"
      ],
      iconClass: "i-mdi-lightbulb",
      gradient: "from-yellow-600 to-orange-600"
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
      value: "99.95%",
      label: "Uptime SLA"
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