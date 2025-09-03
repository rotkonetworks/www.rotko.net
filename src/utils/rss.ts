// src/utils/rss.ts
import { getAllPosts } from './posts'

export async function generateRSS(): Promise<string> {
  const posts = await getAllPosts()
  const siteUrl = 'https://rotko.net'
  
  const items = posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <description>${post.description}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${siteUrl}/blog/${post.slug}</guid>
    </item>
  `).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Rotko Networks Blog</title>
    <link>${siteUrl}</link>
    <description>AS142108 - Direct BGP to bare metal</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`
}
