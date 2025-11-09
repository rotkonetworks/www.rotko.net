import { Component, For, Show, createSignal, onMount } from 'solid-js'
import { A } from '@solidjs/router'
import { getAllNews, NewsMeta } from '../utils/news'

interface NewsPreviewProps {
  limit?: number
  showViewAll?: boolean
}

const NewsPreview: Component<NewsPreviewProps> = (props) => {
  const [news, setNews] = createSignal<NewsMeta[]>([])
  const [loading, setLoading] = createSignal(true)

  const limit = props.limit || 3
  const showViewAll = props.showViewAll ?? true

  onMount(async () => {
    try {
      const loadedNews = await getAllNews()
      setNews(loadedNews.slice(0, limit))
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <section class="py-8 px-4 max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 class="text-xl font-bold text-cyan-400">Latest News</h2>
        <Show when={showViewAll}>
          <A href="/news" class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm underline">
            [view all →]
          </A>
        </Show>
      </div>

      <Show when={!loading()} fallback={
        <div class="text-gray-400">Loading news...</div>
      }>
        <Show when={news().length > 0} fallback={
          <div class="text-gray-400">No news yet.</div>
        }>
          <div class="space-y-4">
            <For each={news()}>
              {(item) => (
                <A
                  href={`/news/${item.slug}`}
                  class="block bg-gray-900 border border-gray-700 hover:border-gray-600 p-4 transition-all"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold text-cyan-400 group-hover:text-cyan-300">
                      {item.title}
                    </h3>
                    <time class="text-xs text-gray-500 font-mono ml-4 flex-shrink-0">
                      {new Date(item.date).toLocaleDateString()}
                    </time>
                  </div>
                  <p class="text-gray-400 text-sm mb-2">
                    {item.description}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <For each={item.tags}>
                      {(tag) => (
                        <span class="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded border border-gray-700">
                          {tag}
                        </span>
                      )}
                    </For>
                  </div>
                </A>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </section>
  )
}

export default NewsPreview
