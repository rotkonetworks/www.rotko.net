import { Component, Show, createSignal, onMount, For } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getNewsItem, getRelatedNews, NewsMeta } from '../utils/news'

const NewsPostPage: Component = () => {
  const params = useParams()
  const [newsItem, setNewsItem] = createSignal<{meta: NewsMeta; content: string} | null>(null)
  const [related, setRelated] = createSignal<NewsMeta[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const [loadedItem, relatedItems] = await Promise.all([
        getNewsItem(params.slug),
        getRelatedNews(params.slug)
      ])
      setNewsItem(loadedItem)
      setRelated(relatedItems)
    } catch (error) {
      console.error('Failed to load news item:', error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <MainLayout>
      <article class="pt-12 pb-16 px-4 max-w-3xl mx-auto">
        <Show when={!loading()} fallback={<div class="text-gray-400">Loading…</div>}>
          <Show when={newsItem()} fallback={<div class="text-gray-400">News item not found.</div>}>
            <A href="/news" class="text-sm text-gray-500 hover:text-cyan-400">← News</A>

            <header class="mt-4 mb-10">
              <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">{newsItem().meta.title}</h1>
              <div class="flex items-center gap-3 text-sm text-gray-500 mt-4">
                <time>{new Date(newsItem().meta.date).toLocaleDateString()}</time>
                <span>·</span>
                <span>{Math.ceil(newsItem().content.split(' ').length / 200)} min read</span>
              </div>
              <div class="flex flex-wrap gap-2 mt-4">
                <For each={newsItem().meta.tags}>
                  {(tag) => (
                    <span class="text-xs px-2 py-0.5 bg-gray-800/70 text-gray-400 rounded">{tag}</span>
                  )}
                </For>
              </div>
            </header>

            <div class="article" innerHTML={newsItem().content} />

            <Show when={related().length > 0}>
              <div class="mt-16 pt-8 border-t border-gray-800/60">
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Related news</h2>
                <div class="space-y-2">
                  <For each={related()}>
                    {(relatedItem) => (
                      <div>
                        <A href={`/news/${relatedItem.slug}`} class="text-cyan-400 hover:text-cyan-300">
                          {relatedItem.title}
                        </A>
                        <span class="text-gray-600 text-xs ml-2">
                          {new Date(relatedItem.date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </Show>
        </Show>
      </article>
    </MainLayout>
  )
}

export default NewsPostPage
