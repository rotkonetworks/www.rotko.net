import { Component, For, Show, createSignal, onMount } from 'solid-js'
import { A } from '@solidjs/router'
import { getAllPosts, PostMeta } from '../utils/posts'

interface BlogPreviewProps {
 limit?: number
 showViewAll?: boolean
}

const BlogPreview: Component<BlogPreviewProps> = (props) => {
 const [posts, setPosts] = createSignal<PostMeta[]>([])
 const [loading, setLoading] = createSignal(true)
 
 const limit = props.limit || 3
 const showViewAll = props.showViewAll ?? true

 onMount(async () => {
   try {
     const loadedPosts = await getAllPosts()
     setPosts(loadedPosts.slice(0, limit))
   } catch (error) {
     console.error('Failed to load posts:', error)
   } finally {
     setLoading(false)
   }
 })

 return (
   <section class="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
     <div class="max-w-6xl mx-auto">
       <div class="flex justify-between items-center mb-8 md:mb-12">
         <h2 class="text-3xl md:text-4xl font-bold text-white">Latest Updates</h2>
         <Show when={showViewAll}>
           <A href="/blog" class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
             View all →
           </A>
         </Show>
       </div>
       
       <Show when={!loading()} fallback={
         <div class="text-gray-400">Loading posts...</div>
       }>
         <Show when={posts().length > 0} fallback={
           <div class="text-gray-400">No posts yet.</div>
         }>
           <div class="grid md:grid-cols-3 gap-6 md:gap-8">
             <For each={posts()}>
               {(post) => (
                 <A 
                   href={`/blog/${post.slug}`}
                   class="group block bg-gray-900/30 h-full flex flex-col border border-gray-800 hover:border-gray-600 p-6 transition-all"
                 >
                   <div class="flex justify-between items-start mb-3">
                     <time class="text-xs text-gray-500">
                       {new Date(post.date).toLocaleDateString()}
                     </time>
                   </div>
                   <h3 class="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                     {post.title}
                   </h3>
                   <p class="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
                     {post.description}
                   </p>
                   <div class="flex flex-wrap gap-2">
                     <For each={post.tags.slice(0, 3)}>
                       {(tag) => (
                         <span class="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                           {tag}
                         </span>
                       )}
                     </For>
                   </div>
                 </A>
               )}
             </For>
           </div>
         </Show>
       </Show>
     </div>
   </section>
 )
}

export default BlogPreview
