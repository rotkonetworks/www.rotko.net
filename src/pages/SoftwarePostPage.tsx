import { Component, Show, createSignal, onMount } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getSoftware, SoftwareMeta } from '../utils/software'

const SoftwarePostPage: Component = () => {
  const params = useParams()
  const [software, setSoftware] = createSignal<{meta: SoftwareMeta; content: string} | null>(null)
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
      <article class="pt-12 pb-8 px-4 max-w-5xl mx-auto">
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

            <div class="max-w-4xl mx-auto">
              <div class="border border-gray-700 bg-gray-900 p-8">
                <div
                  class="text-gray-300 text-justify [&_h1]:text-3xl [&_h1]:text-cyan-400 [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-left [&_h2]:text-2xl [&_h2]:text-cyan-400 [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-left [&_h3]:text-xl [&_h3]:text-cyan-400 [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-left [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-justify [&_a]:text-cyan-400 [&_a]:no-underline [&_a:hover]:text-cyan-300 [&_strong]:text-white [&_strong]:font-semibold [&_code]:text-cyan-400 [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-900 [&_pre]:border [&_pre]:border-gray-700 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:text-left [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_blockquote]:italic"
                  innerHTML={software().content}
                />
              </div>
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