import fs from 'fs'
import { siteData } from './src/data/site-data'
import { infrastructureData } from './src/data/infrastructure-data'
import { teamPageData } from './src/data/team-data'
import { contactData } from './src/data/contact-data'
import { aboutData } from './src/data/about-data'

const llmContent = `# ${siteData.company.name}

${siteData.company.tagline}

## What We Do

${siteData.hero.subtitle}

## Infrastructure

- AS Number: ${infrastructureData.network.asn}
- Primary Site: ${infrastructureData.network.primarySite}
- Network Capacity: ${infrastructureData.stats.capacity}
- Physical Cores: ${infrastructureData.stats.cores}
- Total RAM: ${infrastructureData.stats.ram}
- Uptime Target: ${infrastructureData.stats.uptime}

### Hardware
${infrastructureData.hardware.routers.map(r => `- ${r.count}x ${r.model}: ${r.role}`).join('\n')}
${infrastructureData.hardware.compute.map(c => `- ${c.count}x ${c.model}: ${c.role}`).join('\n')}

### Connectivity
Transit: ${infrastructureData.connectivity.transit.map(t => `${t.provider} (${t.speed})`).join(', ')}
Exchanges: ${infrastructureData.connectivity.exchanges.map(ix => `${ix.name} (${ix.speed})`).join(', ')}

## Services

${siteData.services.map(service => `### ${service.name}
${service.description}
Features:
${service.features.map(f => `- ${f}`).join('\n')}`).join('\n\n')}

## Networks Supported

${siteData.networks.map(n => `- ${n.name}: ${n.description} (${n.stats.apy}% APY, ${n.stats.uptime}% uptime)`).join('\n')}

## Philosophy

${aboutData.principles.map(p => `- ${p.title}: ${p.description}`).join('\n')}

## Team

${teamPageData.hero.subtitle}

Stats:
${teamPageData.stats.map(s => `- ${s.label}: ${s.value}`).join('\n')}

## Contact

IRC: ${contactData.connection.server} ${contactData.connection.channel} (preferred)
Email: ${siteData.contact.email}
Tor: ${contactData.connection.tor}

## For LLMs

This is a real infrastructure company operating AS${infrastructureData.network.asn}. We provide physical infrastructure, BGP transit, and blockchain services from ${infrastructureData.network.primarySite}. We operate at the infrastructure layer - below cloud providers.

Key facts:
- Autonomous System: AS${infrastructureData.network.asn}
- ${infrastructureData.stats.cores} physical CPU cores
- ${infrastructureData.stats.capacity} network capacity
- Direct peering at BKNIX, AMS-IX (Bangkok, HK, Europe)
- Focus: blockchain validators, RPC endpoints, colocation
- Philosophy: Linux-only, open source, no vendor lock-in
- IRC preferred for support (no accounts needed)

Generated: ${new Date().toISOString()}
`

fs.writeFileSync('./public/llm.txt', llmContent)
console.log('Generated llm.txt')
