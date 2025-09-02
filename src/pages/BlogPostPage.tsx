import { Component, Show, createSignal, onMount, For } from 'solid-js'
import { useParams } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getPost } from '../utils/posts'
import { components } from '../components/BlogComponents'

const BlogPostPage: Component = () => {
  const params = useParams()
  const [post, setPost] = createSignal<any>(null)
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const loadedPost = await getPost(params.slug)
      setPost(loadedPost)
    } catch (error) {
      console.error('Failed to load post:', error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <MainLayout>
      <article class="py-24 px-6 lg:px-12 max-w-4xl mx-auto">
        <Show when={!loading()} fallback={<div class="text-gray-400">Loading...</div>}>
          <Show when={post()} fallback={<div class="text-gray-400">Post not found.</div>}>
            <header class="mb-12">
              <h1 class="text-4xl font-bold mb-4 text-white">{post().meta.title}</h1>
              <div class="text-sm text-gray-500 mb-4">
                {new Date(post().meta.date).toLocaleDateString()}
              </div>
              <div class="flex gap-2">
                <For each={post().meta.tags}>
                  {(tag) => (
                    <span class="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                      {tag}
                    </span>
                  )}
                </For>
              </div>
            </header>
            <div 
              class="prose prose-invert max-w-none prose-headings:text-cyan-400 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 prose-strong:text-white prose-code:text-cyan-400 prose-code:bg-gray-800 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700"
              innerHTML={post().content}
            />
          </Show>
        </Show>
      </article>
    </MainLayout>
  )
}

export default BlogPostPage
