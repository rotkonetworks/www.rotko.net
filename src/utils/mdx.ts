import fm from 'front-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'

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

  for (const [path, content] of Object.entries(modules)) {
    const slug = path.split('/').pop()?.replace('.mdx', '') || ''
    const { attributes, body: markdown } = fm(content as string)

    const processedContent = await remark()
      .use(remarkGfm)
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
    .use(remarkHtml)
    .process(markdown)

  return {
    slug,
    meta: metaTransform(attributes, slug),
    content: processedContent.toString()
  }
}