// Sitemap generator utility
const BASE_URL = 'https://rotko.net'

interface SitemapEntry {
  url: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  lastmod?: string
}

const staticPages: SitemapEntry[] = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/services', changefreq: 'monthly', priority: 0.8 },
  { url: '/infrastructure', changefreq: 'weekly', priority: 0.8 },
  { url: '/team', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog', changefreq: 'daily', priority: 0.6 },
  { url: '/software', changefreq: 'weekly', priority: 0.6 }
]

export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(entry => `  <url>
    <loc>${BASE_URL}${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`)
  .join('\n')}
</urlset>`

  return xml
}

// Generate static sitemap
export function generateStaticSitemap(): string {
  const today = new Date().toISOString().split('T')[0]
  const entriesWithDate = staticPages.map(page => ({
    ...page,
    lastmod: today
  }))

  return generateSitemapXML(entriesWithDate)
}