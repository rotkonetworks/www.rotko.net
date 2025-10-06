import { Component, For, Show, createSignal, onMount } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getAllSoftware, SoftwareMeta } from '../utils/software'

const SoftwarePage: Component = () => {
  const [software, setSoftware] = createSignal<{ meta: SoftwareMeta; content: string }[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string>('')

  onMount(async () => {
    try {
      const allSoftware = await getAllSoftware()
      setSoftware(allSoftware)
    } catch (err) {
      console.error('Failed to load software:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  })

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400 mb-2">Software</h1>
          <p class="text-gray-300">Open source projects and tools we've built for the community</p>
        </div>

        <Show when={error()}>
          <div class="text-red-400 mb-4">Error: {error()}</div>
        </Show>

        <Show when={!loading()} fallback={<div class="text-gray-400">Loading software...</div>}>
          <Show when={software().length > 0} fallback={<div class="text-gray-400">No software projects found.</div>}>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={software()}>
                {(item) => (
                  <div class="border border-gray-700 bg-gray-900 p-6 h-full flex flex-col">
                    <h2 class="text-xl font-bold text-cyan-400 font-mono mb-2">{item.meta.title}</h2>
                    {item.meta.description && (
                      <p class="text-gray-400 text-sm mb-4 flex-1">{item.meta.description}</p>
                    )}
                    <div class="flex gap-4 text-sm">
                      <A
                        href={`/software/${item.meta.slug}`}
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        [Details]
                      </A>
                      <a
                        href={item.meta.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        [GitHub]
                      </a>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </section>
    </MainLayout>
  )
}

export default SoftwarePage