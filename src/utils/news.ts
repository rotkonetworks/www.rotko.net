import { parseMDXFiles, parseSingleMDX } from './mdx'

export interface NewsMeta {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  draft?: boolean
}

const newsModules = import.meta.glob('/src/news/*.mdx', {
  query: '?raw',
  import: 'default'
})

export async function getAllNews(): Promise<NewsMeta[]> {
  const news = await parseMDXFiles(newsModules, (data, slug) => ({
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags || [],
    draft: data.draft || false
  }))

  return news
    .filter(item => !item.meta.draft)
    .map(item => item.meta)
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
}

export async function getNewsItem(slug: string): Promise<{ meta: NewsMeta; content: string } | null> {
  const key = Object.keys(newsModules).find(p => p.endsWith(`/${slug}.mdx`))
  if (!key) return null

  const loader = newsModules[key]
  const content = await loader()

  if (!content) return null

  const result = await parseSingleMDX(content as string, slug, (data, slug) => ({
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags || [],
    draft: data.draft || false
  }))

  return {
    meta: result.meta,
    content: result.content
  }
}

export async function getRelatedNews(currentSlug: string, limit = 3): Promise<NewsMeta[]> {
  const allNews = await getAllNews()
  const currentItem = allNews.find(p => p.slug === currentSlug)

  if (!currentItem) return []

  return allNews
    .filter(p => p.slug !== currentSlug)
    .map(item => ({
      ...item,
      relevance: item.tags.filter(tag =>
        currentItem.tags.includes(tag)
      ).length
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(({ relevance, ...item }) => item)
}
