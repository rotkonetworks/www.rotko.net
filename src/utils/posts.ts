export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
}

// Hardcode the post data for now to get it working
export async function getAllPosts(): Promise<PostMeta[]> {
  return [
    {
      slug: 'penumbra-cryptocurrency',
      title: 'Penumbra: The Most Mispriced Protocol in Crypto',
      description: 'Four years of cryptographic research valued at less than a two-bedroom house',
      date: '2025-09-02',
      tags: ['blockchain', 'privacy', 'crypto', 'mev']
    }
  ]
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
  if (slug !== 'penumbra-cryptocurrency') return null
  
  const meta = {
    slug: 'penumbra-cryptocurrency',
    title: 'Penumbra: The Most Mispriced Protocol in Crypto',
    description: 'Four years of cryptographic research valued at less than a two-bedroom house',
    date: '2025-09-02',
    tags: ['blockchain', 'privacy', 'crypto', 'mev']
  }
  
  // Load actual content from file
  try {
    const response = await fetch('/src/posts/penumbra-cryptocurrency.md')
    const text = await response.text()
    // Remove frontmatter and convert to HTML
    const content = text.replace(/^---[\s\S]*?---\n/, '')
    return { meta, content: `<pre>${content}</pre>` }
  } catch (e) {
    // Fallback content
    return {
      meta,
      content: `
        <h2>The $1.5 million anomaly</h2>
        <p>Penumbra's market cap is $1.5M. The entire protocol is valued at less than a suburban house.</p>
        <p>Full post content coming soon...</p>
      `
    }
  }
}
