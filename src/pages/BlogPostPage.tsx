import { Component, Show, createSignal, onMount, For } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { getPost, getRelatedPosts, PostMeta } from '../utils/posts'

const BlogPostPage: Component = () => {
  const params = useParams()
  const [post, setPost] = createSignal<{meta: PostMeta; content: string} | null>(null)
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
      <article class="pt-12 pb-8 px-4 max-w-5xl mx-auto">
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

            <div class="max-w-4xl mx-auto">
              <div class="border border-gray-700 bg-gray-900 p-8 mb-8">
                <div
                  class="text-gray-300 text-justify [&_h1]:text-3xl [&_h1]:text-cyan-400 [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-left [&_h2]:text-2xl [&_h2]:text-cyan-400 [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-left [&_h3]:text-xl [&_h3]:text-cyan-400 [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-left [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-justify [&_a]:text-cyan-400 [&_a]:no-underline [&_a:hover]:text-cyan-300 [&_strong]:text-white [&_strong]:font-semibold [&_code]:text-cyan-400 [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-900 [&_pre]:border [&_pre]:border-gray-700 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:text-left [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_blockquote]:italic"
                  innerHTML={post().content}
                />
              </div>
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