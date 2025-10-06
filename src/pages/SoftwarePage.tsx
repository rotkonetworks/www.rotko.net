import { Component, For, Show, createSignal, onMount } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getAllSoftware, SoftwareMeta } from '../utils/software'
import { softwarePageData } from '../data/software-data'
import { softwareProjects } from '../data/software-projects'

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
          <h1 class="text-3xl font-bold text-cyan-400 mb-2">{softwarePageData.hero.title}</h1>
          <p class="text-gray-300">{softwarePageData.hero.subtitle}</p>
        </div>

        <Show when={error()}>
          <div class="text-red-400 mb-4">{softwarePageData.messages.error} {error()}</div>
        </Show>

        <Show when={!loading()} fallback={<div class="text-gray-400">{softwarePageData.messages.loading}</div>}>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Static software projects (like vctl) */}
            <For each={softwareProjects}>
              {(project) => (
                <div class="border border-gray-700 bg-gray-900 p-6 h-full flex flex-col">
                  <div class="flex items-start justify-between mb-2">
                    <A
                      href={`/software/${project.slug}`}
                      class="text-xl font-bold text-cyan-400 font-mono hover:text-cyan-300 transition-colors"
                    >
                      {project.title}
                    </A>
                    <Show when={project.type === 'app'}>
                      <span class="px-2 py-1 bg-cyan-900/30 text-cyan-400 text-xs rounded">Interactive</span>
                    </Show>
                  </div>
                  <p class="text-gray-400 text-sm mb-4 flex-1">{project.description}</p>
                  <Show when={project.tags}>
                    <div class="flex flex-wrap gap-1 mb-3">
                      <For each={project.tags}>
                        {(tag) => (
                          <span class="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                  <div class="flex gap-4 text-sm">
                    <Show when={project.type === 'app'}>
                      <A
                        href={`/software/${project.slug}`}
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        [Launch Tool]
                      </A>
                    </Show>
                    <Show when={project.website}>
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        [Website]
                      </a>
                    </Show>
                    <Show when={project.repo}>
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {softwarePageData.links.github}
                      </a>
                    </Show>
                  </div>
                </div>
              )}
            </For>

            {/* MDX-based software projects */}
            <For each={software()}>
              {(item) => (
                <div class="border border-gray-700 bg-gray-900 p-6 h-full flex flex-col">
                  <A
                    href={`/software/${item.meta.slug}`}
                    class="text-xl font-bold text-cyan-400 font-mono hover:text-cyan-300 transition-colors mb-2"
                  >
                    {item.meta.title}
                  </A>
                  {item.meta.description && (
                    <p class="text-gray-400 text-sm mb-4 flex-1">{item.meta.description}</p>
                  )}
                  <Show when={item.meta.tags}>
                    <div class="flex flex-wrap gap-1 mb-3">
                      <For each={item.meta.tags}>
                        {(tag) => (
                          <span class="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                  <div class="flex gap-4 text-sm">
                    <Show when={item.meta.website}>
                      <a
                        href={item.meta.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        [Website]
                      </a>
                    </Show>
                    <Show when={item.meta.repo}>
                      <a
                        href={item.meta.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {softwarePageData.links.github}
                      </a>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </section>
    </MainLayout>
  )
}

export default SoftwarePage