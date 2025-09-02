import { Component } from 'solid-js'
import MainLayout from '../layouts/MainLayout'

const BlogPage: Component = () => {
  return (
    <MainLayout>
      <section class="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold mb-6 text-cyan-400 font-mono">Blog</h1>
        <p class="text-gray-400">No posts yet.</p>
      </section>
    </MainLayout>
  )
}

export default BlogPage
