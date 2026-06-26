import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { siteData } from '../data/site-data'
import { OFFERINGS } from '../data/services-data'
import BlogPreview from '../components/BlogPreview'
import NewsPreview from '../components/NewsPreview'

const HomePage: Component = () => {

  return (
    <MainLayout>
      {/* Hero */}
      <section class="pt-16 pb-10 px-4 max-w-6xl mx-auto">
        <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-4">
          {siteData.company.tagline}
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] max-w-3xl">
          {siteData.hero.title}
        </h1>
        <p class="text-lg md:text-xl text-gray-300 mt-6 max-w-2xl leading-relaxed">
          {siteData.hero.subtitle}
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <a href="/hosting" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            Deploy a VM →
          </a>
          <a href="/colocation" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md border border-gray-700 hover:border-gray-600 text-gray-200 transition-colors">
            Colocation pricing
          </a>
          <a href="/contact" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md text-gray-300 hover:text-white transition-colors">
            Talk to us
          </a>
        </div>

        <div class="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 border-t border-gray-800 pt-6">
          <For each={siteData.hero.points}>
            {(point) => (
              <span class="flex items-center gap-2">
                <span class="i-mdi-check text-cyan-500 flex-shrink-0" />
                {point}
              </span>
            )}
          </For>
        </div>
      </section>

      {/* Stats */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <For each={Object.values(siteData.infrastructure)}>
            {(stat) => (
              <div class="rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-4">
                <div class="text-2xl md:text-3xl font-bold text-white font-mono">{stat.value}</div>
                <div class="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            )}
          </For>
        </div>
      </section>

      {/* Products */}
      <section class="py-12 px-4 max-w-6xl mx-auto">
        <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">What we sell</div>
        <h2 class="text-2xl font-bold text-white tracking-tight mb-6">
          Infrastructure you can rent or run yourself
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <For each={OFFERINGS}>
            {(o) => (
              <a
                href={o.href}
                class="group block rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors p-6"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class={`${o.icon} text-cyan-400 text-2xl`} />
                    <h3 class="text-lg font-semibold text-white">{o.title}</h3>
                  </div>
                  <span class="text-xs font-mono text-gray-500 flex-shrink-0">{o.price}</span>
                </div>
                <p class="text-sm text-gray-400 mt-3 leading-relaxed">{o.desc}</p>
                <span class="mt-4 inline-flex items-center gap-1 text-sm text-cyan-400 group-hover:text-cyan-300">
                  {o.cta} →
                </span>
              </a>
            )}
          </For>
        </div>
      </section>

      {/* Free public RPC band */}
      <section class="py-6 px-4 max-w-6xl mx-auto">
        <a
          href="/services/endpoints"
          class="group block rounded-xl border border-gray-800 bg-gradient-to-r from-cyan-950/30 to-gray-900/40 hover:border-cyan-700/60 transition-colors p-6 md:p-7"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="max-w-2xl">
              <div class="flex items-center gap-2">
                <span class="i-mdi-flash text-cyan-400 text-xl" />
                <span class="text-xs uppercase tracking-[0.18em] text-cyan-400/90">Free public RPC</span>
              </div>
              <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight mt-2">
                Archive endpoints for Polkadot, Penumbra &amp; more. No key, no rate limits
              </h2>
              <p class="text-sm text-gray-400 mt-2">
                WebSocket, HTTPS and gRPC under <span class="text-cyan-400">*.rotko.net</span>, with live health monitoring. Paste a URL and go.
              </p>
            </div>
            <span class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 group-hover:bg-cyan-500 text-white transition-colors flex-shrink-0">
              Browse endpoints →
            </span>
          </div>
        </a>
      </section>

      {/* News Preview */}
      <NewsPreview limit={3} />

      {/* Blog Preview */}
      <BlogPreview limit={3} />

      {/* CTA */}
      <section class="py-12 px-4 max-w-6xl mx-auto">
        <div class="rounded-xl border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-8 md:p-10 text-center">
          <h2 class="text-2xl font-bold text-white tracking-tight mb-2">
            {siteData.cta.title}
          </h2>
          <p class="text-gray-400 mb-6">
            {siteData.cta.subtitle}
          </p>
          <a
            href="/contact"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            {siteData.cta.button} →
          </a>
        </div>
      </section>
    </MainLayout>
  )
}

export default HomePage