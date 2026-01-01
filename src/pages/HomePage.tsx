import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import ServiceCard from '../components/ServiceCard'
import { siteData } from '../data/site-data'
import BlogPreview from '../components/BlogPreview'
import NewsPreview from '../components/NewsPreview'

const HomePage: Component = () => {

  return (
    <MainLayout>
      {/* Hero */}
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        <div class="mb-8 border-b border-gray-700 pb-8">
          <div class="text-xs font-mono text-cyan-400 mb-2 uppercase">
            {siteData.company.tagline}
          </div>
          <h1 class="text-3xl font-bold mb-2 text-cyan-400">
            {siteData.hero.title}
          </h1>
          <p class="text-gray-300">
            {siteData.hero.subtitle}
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-2 text-sm">
          <For each={siteData.hero.points}>
            {(point) => (
              <div class="flex items-start">
                <span class="text-cyan-500 mr-2">•</span>
                <span class="text-gray-300">{point}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      {/* Stake CTA */}
      <section class="py-6 px-4 max-w-6xl mx-auto">
        <a
          href="/software/vctl"
          class="block p-6 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-700 hover:border-cyan-500 transition-colors group"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-cyan-400 group-hover:text-cyan-300 mb-1">
                Stake with Rotko
              </h2>
              <p class="text-gray-400 text-sm">
                Polkadot, Kusama, Penumbra — direct nomination or pools
              </p>
            </div>
            <div class="text-cyan-400 group-hover:text-cyan-300 font-mono">
              [open vctl →]
            </div>
          </div>
        </a>
      </section>

      {/* Stats */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <div class="border border-gray-700 bg-gray-900 p-6">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Infrastructure</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <For each={Object.values(siteData.infrastructure)}>
              {(stat) => (
                <div>
                  <span class="text-cyan-400 font-mono font-bold">{stat.value}</span>
                  <span class="text-gray-400 ml-2">{stat.label}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Services */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <h2 class="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
          {siteData.sections.services}
        </h2>
        <div class="grid md:grid-cols-3 gap-4">
          <For each={siteData.services}>
            {(service) => <ServiceCard service={service} />}
          </For>
        </div>
      </section>


      {/* News Preview */}
      <NewsPreview limit={3} />

      {/* Blog Preview */}
      <BlogPreview limit={3} />

      {/* Links & Contact */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <h2 class="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
          Links & Contact
        </h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="border border-gray-700 bg-gray-900 p-4">
            <h3 class="text-cyan-400 font-bold mb-3">Get in Touch</h3>
            <div class="space-y-2 font-mono text-sm">
              <div>
                <span class="text-gray-400">email:</span>
                <a href={`mailto:${siteData.contact.email}`} class="text-cyan-400 hover:text-cyan-300 ml-2 underline">
                  {siteData.contact.email}
                </a>
              </div>
              <div>
                <span class="text-gray-400">irc:</span>
                <span class="text-gray-300 ml-2">
                  {siteData.contact.irc.server} {siteData.contact.irc.channel}
                </span>
              </div>
            </div>
          </div>

          <div class="border border-gray-700 bg-gray-900 p-4">
            <h3 class="text-cyan-400 font-bold mb-3">External Links</h3>
            <div class="space-y-2 font-mono text-sm">
              <div>
                <a
                  href="https://github.com/rotkonetworks"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >
                  [GitHub]
                </a>
                <span class="text-gray-400 ml-2">rotkonetworks</span>
              </div>
              <div>
                <a
                  href="https://www.linkedin.com/company/rotko-networks"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >
                  [LinkedIn]
                </a>
                <span class="text-gray-400 ml-2">rotko-networks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section class="py-8 px-4 max-w-6xl mx-auto">
        <div class="border border-gray-700 bg-gray-900 p-8 text-center">
          <h2 class="text-xl font-bold text-cyan-400 mb-2">
            {siteData.cta.title}
          </h2>
          <p class="text-gray-400 mb-4 text-sm">
            {siteData.cta.subtitle}
          </p>
          <a
            href="/contact"
            class="text-cyan-400 hover:text-cyan-300 underline"
          >
            [{siteData.cta.button}]
          </a>
        </div>
      </section>
    </MainLayout>
  )
}

export default HomePage