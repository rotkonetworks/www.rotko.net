import fm from 'front-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export interface ParsedMDX<T = any> {
  meta: T
  content: string
  slug: string
}

export async function parseMDXFiles<T>(
  modules: Record<string, unknown>,
  metaTransform: (attributes: any, slug: string) => T
): Promise<ParsedMDX<T>[]> {
  const results: ParsedMDX<T>[] = []

  for (const [path, moduleLoader] of Object.entries(modules)) {
    const slug = path.split('/').pop()?.replace('.mdx', '') || ''

    // Handle both eager-loaded content and lazy-loaded functions
    let content: string
    if (typeof moduleLoader === 'function') {
      // Lazy-loaded module
      content = await moduleLoader() as string
    } else {
      // Eager-loaded module
      content = moduleLoader as string
    }

    const { attributes, body: markdown } = fm(content)

    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkBreaks)
      .use(remarkHtml)
      .process(markdown)

    results.push({
      slug,
      meta: metaTransform(attributes, slug),
      content: processedContent.toString()
    })
  }

  return results
}

export async function parseSingleMDX<T>(
  content: string,
  slug: string,
  metaTransform: (attributes: any, slug: string) => T
): Promise<ParsedMDX<T>> {
  const { attributes, body: markdown } = fm(content)

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkHtml)
    .process(markdown)

  return {
    slug,
    meta: metaTransform(attributes, slug),
    content: processedContent.toString()
  }
}