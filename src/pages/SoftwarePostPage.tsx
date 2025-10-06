import { Component, Show, createSignal, onMount } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getSoftware, SoftwareMeta } from '../utils/software'

const SoftwarePostPage: Component = () => {
  const params = useParams()
  const [software, setSoftware] = createSignal<any>(null)
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const loadedSoftware = await getSoftware(params.slug)
      setSoftware(loadedSoftware)
    } catch (error) {
      console.error('Failed to load software:', error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <MainLayout>
      <article class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <Show when={!loading()} fallback={<div class="text-gray-400">Loading...</div>}>
          <Show when={software()} fallback={<div class="text-gray-400">Software not found.</div>}>
            <header class="mb-8 border-b border-gray-700 pb-4">
              <h1 class="text-3xl font-bold text-cyan-400 mb-2 font-mono">{software().meta.title}</h1>
              {software().meta.description && (
                <p class="text-gray-300 mb-4">{software().meta.description}</p>
              )}
              <div class="flex gap-4 flex-wrap">
                <a
                  href={software().meta.repo}
                  target="_blank"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >
                  [View on GitHub]
                </a>
                {software().meta.website && (
                  <a
                    href={software().meta.website}
                    target="_blank"
                    class="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    [Visit Website]
                  </a>
                )}
              </div>
            </header>

            <div class="border border-gray-700 bg-gray-900 p-6">
              <div
                class="prose prose-invert prose-lg prose-headings:text-cyan-400 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 prose-strong:text-white prose-code:text-cyan-400 prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700"
                style="max-width: 85ch"
                innerHTML={software().content}
              />
            </div>

            <div class="mt-8 pt-4 border-t border-gray-700">
              <A
                href="/software"
                class="text-cyan-400 hover:text-cyan-300 underline"
              >
                [← Back to Software]
              </A>
            </div>
          </Show>
        </Show>
      </article>
    </MainLayout>
  )
}

export default SoftwarePostPage