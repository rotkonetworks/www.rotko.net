import { Component, For, Show, createSignal, onMount } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { getAllPosts, PostMeta } from '../utils/posts'
import { A } from '@solidjs/router'
import { blogPageData } from '../data/blog-data'

const BlogPage: Component = () => {
  const [posts, setPosts] = createSignal<PostMeta[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string>('')

  onMount(async () => {
    try {
      const loadedPosts = await getAllPosts()
      setPosts(loadedPosts)
    } catch (err) {
      console.error('Failed to load posts:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  })

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400">{blogPageData.hero.title}</h1>
        </div>

        <Show when={error()}>
          <div class="text-red-400 mb-4">{blogPageData.messages.error} {error()}</div>
        </Show>

        <Show when={!loading()} fallback={<div class="text-gray-400">{blogPageData.messages.loading}</div>}>
          <Show when={posts().length > 0} fallback={<div class="text-gray-400">{blogPageData.messages.noPosts}</div>}>
            <div class="space-y-6">
              <For each={posts()}>
                {(post) => (
                  <article class="border border-gray-700 bg-gray-900 p-6">
                    <A href={`/blog/${post.slug}`} class="block">
                      <h2 class="text-xl font-bold text-cyan-400 hover:text-cyan-300 mb-2">
                        {post.title}
                      </h2>
                      <div class="text-xs text-gray-500 mb-2 font-mono">
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <p class="text-gray-400 text-sm mb-3">{post.description}</p>
                      <div class="flex flex-wrap gap-2">
                        <For each={post.tags}>
                          {(tag) => (
                            <span class="text-xs text-gray-400">
                              [{tag}]
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

export default BlogPage