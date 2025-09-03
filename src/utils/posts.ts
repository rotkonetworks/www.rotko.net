import fm from 'front-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

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
  import: 'default',
  eager: true
})
console.log("Post modules found:", Object.keys(postModules))

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts: PostMeta[] = []
  
  for (const [path, content] of Object.entries(postModules)) {
    const slug = path.split('/').pop()?.replace('.mdx', '') || ''
    const { attributes: data } = fm(content as string)
    
    if (!data.draft) {
      posts.push({
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        tags: data.tags || [],
        draft: data.draft || false
      })
    }
  }
  
  return posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
  const key = Object.keys(postModules).find(p => p.endsWith(`/${slug}.mdx`))
  const content = key ? postModules[key] : undefined
  
  if (!content) return null
  
  const { attributes: data, body: markdown } = fm(content as string)
  
  const processedContent = await remark()
    .use(gfm)
    .use(html)
    .process(markdown)
  
  return {
    meta: {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      tags: data.tags || [],
      draft: data.draft || false
    },
    content: processedContent.toString()
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
