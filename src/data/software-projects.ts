export interface SoftwareProject {
  slug: string
  title: string
  description: string
  category: 'tool' | 'library' | 'service'
  type: 'mdx' | 'app'  // mdx for markdown pages, app for interactive tools
  repo?: string
  website?: string
  tags?: string[]
}

export const softwareProjects: SoftwareProject[] = [
  {
    slug: 'vctl',
    title: 'vctl',
    description: 'Client-side validator control interface for Polkadot and Kusama networks. WebAssembly-based implementation for session key management and staking operations.',
    category: 'tool',
    type: 'app',
    repo: 'https://github.com/rotkonetworks/www.rotko.net',
    tags: ['polkadot', 'kusama', 'validator', 'staking', 'wasm', 'client-side']
  }
  // Other MDX-based software projects will be auto-discovered from /src/pages/software/*.mdx
]