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
      <article class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <Show when={!loading()} fallback={<div class="text-gray-400">Loading...</div>}>
          <Show when={post()} fallback={<div class="text-gray-400">Post not found.</div>}>
            <header class="mb-8 border-b border-gray-700 pb-4">
              <h1 class="text-3xl font-bold text-cyan-400 mb-2">{post().meta.title}</h1>
              <div class="flex items-center gap-4 text-sm text-gray-400 mb-2">
                <time>{new Date(post().meta.date).toLocaleDateString()}</time>
                <span>•</span>
                <span>{Math.ceil(post().content.split(' ').length / 200)} min read</span>
              </div>
              <div class="flex gap-2">
                <For each={post().meta.tags}>
                  {(tag) => (
                    <span class="text-xs text-gray-400">
                      [{tag}]
                    </span>
                  )}
                </For>
              </div>
            </header>

            <div class="border border-gray-700 bg-gray-900 p-6 mb-8">
              <div
                class="prose prose-invert prose-lg prose-max-w-none prose-headings:text-cyan-400 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 prose-strong:text-white prose-code:text-cyan-400 prose-code:bg-gray-800 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700"
                style="max-width: 85ch"
                innerHTML={post().content}
              />
            </div>

            <Show when={related().length > 0}>
              <div class="border border-gray-700 bg-gray-900 p-6">
                <h2 class="text-xl font-bold text-cyan-400 mb-4">Related Posts</h2>
                <div class="space-y-2">
                  <For each={related()}>
                    {(relatedPost) => (
                      <div>
                        <A
                          href={`/blog/${relatedPost.slug}`}
                          class="text-cyan-400 hover:text-cyan-300 underline text-sm"
                        >
                          {relatedPost.title}
                        </A>
                        <span class="text-gray-500 text-xs ml-2">
                          ({new Date(relatedPost.date).toLocaleDateString()})
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <div class="mt-8 pt-4 border-t border-gray-700">
              <A
                href="/blog"
                class="text-cyan-400 hover:text-cyan-300 underline"
              >
                [← Back to Blog]
              </A>
            </div>
          </Show>
        </Show>
      </article>
    </MainLayout>
  )
}

export default BlogPostPage