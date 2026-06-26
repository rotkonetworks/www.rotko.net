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
      <article class="pt-12 pb-16 px-4 max-w-3xl mx-auto">
        <Show when={!loading()} fallback={<div class="text-gray-400">Loading…</div>}>
          <Show when={post()} fallback={<div class="text-gray-400">Post not found.</div>}>
            <A href="/blog" class="text-sm text-gray-500 hover:text-cyan-400">← Blog</A>

            <header class="mt-4 mb-10">
              <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">{post().meta.title}</h1>
              <div class="flex items-center gap-3 text-sm text-gray-500 mt-4">
                <time>{new Date(post().meta.date).toLocaleDateString()}</time>
                <span>·</span>
                <span>{Math.ceil(post().content.split(' ').length / 200)} min read</span>
              </div>
              <div class="flex flex-wrap gap-2 mt-4">
                <For each={post().meta.tags}>
                  {(tag) => (
                    <span class="text-xs px-2 py-0.5 bg-gray-800/70 text-gray-400 rounded">{tag}</span>
                  )}
                </For>
              </div>
            </header>

            <div class="article" innerHTML={post().content} />

            <Show when={related().length > 0}>
              <div class="mt-16 pt-8 border-t border-gray-800/60">
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Related posts</h2>
                <div class="space-y-2">
                  <For each={related()}>
                    {(relatedPost) => (
                      <div>
                        <A href={`/blog/${relatedPost.slug}`} class="text-cyan-400 hover:text-cyan-300">
                          {relatedPost.title}
                        </A>
                        <span class="text-gray-600 text-xs ml-2">
                          {new Date(relatedPost.date).toLocaleDateString()}
                        </span>
                      </div>
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