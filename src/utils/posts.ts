import { parseMDXFiles, parseSingleMDX } from './mdx'

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  draft?: boolean
}

const postModules = import.meta.glob('/src/posts/*.mdx', {
  query: '?raw',
  import: 'default'
})

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts = await parseMDXFiles(postModules, (data, slug) => ({
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags || [],
    draft: data.draft || false
  }))

  return posts
    .filter(post => !post.meta.draft)
    .map(post => post.meta)
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
  const key = Object.keys(postModules).find(p => p.endsWith(`/${slug}.mdx`))
  if (!key) return null

  const loader = postModules[key]
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

export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<PostMeta[]> {
  const allPosts = await getAllPosts()
  const currentPost = allPosts.find(p => p.slug === currentSlug)
  
  if (!currentPost) return []
  
  return allPosts
    .filter(p => p.slug !== currentSlug)
    .map(post => ({
      ...post,
      relevance: post.tags.filter(tag => 
        currentPost.tags.includes(tag)
      ).length
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(({ relevance, ...post }) => post)
}
