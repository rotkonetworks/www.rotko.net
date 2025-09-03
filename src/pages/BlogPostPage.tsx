import { Component, Show, createSignal, onMount, For } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getPost, getRelatedPosts, PostMeta } from '../utils/posts'

const BlogPostPage: Component = () => {
  const params = useParams()
  const [post, setPost] = createSignal<any>(null)
  const [related, setRelated] = createSignal<PostMeta[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const [loadedPost, relatedPosts] = await Promise.all([
        getPost(params.slug),
        getRelatedPosts(params.slug)
      ])
      setPost(loadedPost)
      setRelated(relatedPosts)
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
              <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <time>{new Date(post().meta.date).toLocaleDateString()}</time>
                <span>•</span>
                <span>{Math.ceil(post().content.split(' ').length / 200)} min read</span>
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
            
            <Show when={related().length > 0}>
              <div class="mt-16 pt-8 border-t border-gray-800">
                <h2 class="text-2xl font-bold mb-6 text-white">Related Posts</h2>
                <div class="grid gap-4">
                  <For each={related()}>
                    {(relPost) => (
                      <A 
                        href={`/blog/${relPost.slug}`}
                        class="block bg-gray-900/30 border border-gray-800 hover:border-gray-600 p-4 transition-all"
                      >
                        <h3 class="font-bold text-white hover:text-cyan-400 transition-colors">
                          {relPost.title}
                        </h3>
                        <p class="text-sm text-gray-400 mt-1">{relPost.description}</p>
                      </A>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </Show>
        </Show>
      </article>
    </MainLayout>
  )
}

export default BlogPostPage
