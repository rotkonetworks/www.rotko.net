import { Component, For, Show, createSignal, onMount } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { getAllNews, NewsMeta } from '../utils/news'
import { A } from '@solidjs/router'
import { newsPageData } from '../data/news-data'

const NewsPage: Component = () => {
  const [news, setNews] = createSignal<NewsMeta[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string>('')

  onMount(async () => {
    try {
      const loadedNews = await getAllNews()
      setNews(loadedNews)
    } catch (err) {
      console.error('Failed to load news:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  })

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400">{newsPageData.hero.title}</h1>
        </div>

        <Show when={error()}>
          <div class="text-red-400 mb-4">{newsPageData.messages.error} {error()}</div>
        </Show>

        <Show when={!loading()} fallback={<div class="text-gray-400">{newsPageData.messages.loading}</div>}>
          <Show when={news().length > 0} fallback={<div class="text-gray-400">{newsPageData.messages.noNews}</div>}>
            <div class="space-y-0">
              <For each={news()}>
                {(item) => (
                  <article class="border border-gray-700 bg-gray-900 px-6 py-8 mb-8 hover:border-gray-600 transition-colors">
                    <A href={`/news/${item.slug}`} class="block">
                      <h2 class="text-xl font-bold text-cyan-400 hover:text-cyan-300 mb-2">
                        {item.title}
                      </h2>
                      <div class="text-xs text-gray-500 mb-2 font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                      <p class="text-gray-400 text-sm mb-3">{item.description}</p>
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
                  </article>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </section>
    </MainLayout>
  )
}

export default NewsPage
