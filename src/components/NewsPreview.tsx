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
          <div class="divide-y divide-gray-700 border border-gray-700 bg-gray-900">
            <For each={news()}>
              {(item) => (
                <A
                  href={`/news/${item.slug}`}
                  class="block px-4 py-3 hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-baseline gap-3">
                    <time class="text-xs text-gray-500 font-mono flex-shrink-0 w-20">
                      {new Date(item.date).toLocaleDateString()}
                    </time>
                    <div class="min-w-0">
                      <h3 class="text-sm font-bold text-cyan-400 truncate">
                        {item.title}
                      </h3>
                      <p class="text-gray-500 text-xs mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
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
