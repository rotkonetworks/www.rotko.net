import { Component, For, Show, createSignal, onMount } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { getAllPosts, PostMeta } from '../utils/posts'
import { A } from '@solidjs/router'

const BlogPage: Component = () => {
  const [posts, setPosts] = createSignal<PostMeta[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string>('')

  onMount(async () => {
    try {
      console.log('Loading posts...')
      const loadedPosts = await getAllPosts()
      console.log('Loaded posts:', loadedPosts)
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
      <section class="py-24 px-6 lg:px-12 max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-12 text-white">Blog</h1>
        
        <Show when={error()}>
          <div class="text-red-400">Error: {error()}</div>
        </Show>
        
        <Show when={!loading()} fallback={<div class="text-gray-400">Loading...</div>}>
          <Show when={posts().length > 0} fallback={<div class="text-gray-400">No posts yet.</div>}>
            <div class="space-y-8">
              <For each={posts()}>
                {(post) => (
                  <article class="border-b border-gray-800 pb-8">
                    <A href={`/blog/${post.slug}`} class="group block">
                      <h2 class="text-2xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                        {post.title}
                      </h2>
                      <div class="text-sm text-gray-500 mb-3">
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <p class="text-gray-400 mb-3">{post.description}</p>
                      <div class="flex flex-wrap gap-2">
                        <For each={post.tags}>
                          {(tag) => (
                            <span class="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
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

export default BlogPage
