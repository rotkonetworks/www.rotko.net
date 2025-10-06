import { parseMDXFiles, parseSingleMDX } from './mdx'

export interface SoftwareMeta {
  slug: string
  title: string
  repo: string
  website?: string
  description?: string
  tags?: string[]
}

const softwareModules = import.meta.glob('/src/pages/software/*.mdx', {
  query: '?raw',
  import: 'default'
})

export async function getAllSoftware(): Promise<{ meta: SoftwareMeta; content: string }[]> {
  const software = await parseMDXFiles(softwareModules, (data, slug) => ({
    slug,
    title: data.title,
    repo: data.repo,
    website: data.website,
    description: data.description,
    tags: data.tags
  }))

  return software
}

export async function getSoftware(slug: string): Promise<{ meta: SoftwareMeta; content: string } | null> {
  const key = Object.keys(softwareModules).find(p => p.endsWith(`/${slug}.mdx`))
  if (!key) return null

  const loader = softwareModules[key]
  const content = await loader()

  if (!content) return null

  const result = await parseSingleMDX(content as string, slug, (data, slug) => ({
    slug,
    title: data.title,
    repo: data.repo,
    website: data.website,
    description: data.description,
    tags: data.tags
  }))

  return {
    meta: result.meta,
    content: result.content
  }
}