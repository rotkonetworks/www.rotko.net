// src/utils/posts.ts
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  draft?: boolean
}

// Import all MDX files from posts directory
const postModules = import.meta.glob('/src/posts/*.md', { 
  query: '?raw',
  import: 'default',
  eager: true 
})

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts: PostMeta[] = []
  
  for (const [path, content] of Object.entries(postModules)) {
    const slug = path.split('/').pop()?.replace('.md', '') || ''
    const { data } = matter(content as string)
    
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
  
  // Sort by date descending
  return posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
  const path = `/src/posts/${slug}.md`
  const content = postModules[path]
  
  if (!content) return null
  
  const { data, content: markdown } = matter(content as string)
  
  // Process markdown to HTML
  const processedContent = await remark()
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

// Helper to get related posts
export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<PostMeta[]> {
  const allPosts = await getAllPosts()
  const currentPost = allPosts.find(p => p.slug === currentSlug)
  
  if (!currentPost) return []
  
  // Find posts with matching tags
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
