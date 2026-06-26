import { Component, For } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { servicesData, STAKING_NETWORKS, OFFERINGS } from '../data/services-data'
import WhitelabelSection from '../components/WhitelabelSection'

const ServicesPage: Component = () => {
  const totalValidators = () => STAKING_NETWORKS.reduce((sum, n) => sum + n.validators, 0)

  return (
    <MainLayout>
      <section class="pt-12 pb-12 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="mb-10">
          <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">Services</div>
          <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {servicesData.hero.title}
          </h1>
          <p class="text-lg text-gray-300 mt-5 max-w-2xl leading-relaxed">
            {servicesData.hero.subtitle}
          </p>
        </div>

        {/* Core offerings */}
        <div class="grid md:grid-cols-2 gap-4">
          <For each={OFFERINGS}>
            {(o) => (
              <A
                href={o.href}
                class="group block rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors p-6"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class={`${o.icon} text-cyan-400 text-2xl`} />
                    <h2 class="text-lg font-semibold text-white">{o.title}</h2>
                  </div>
                  <span class="text-xs font-mono text-gray-500 flex-shrink-0">{o.price}</span>
                </div>
                <p class="text-sm text-gray-400 mt-3 leading-relaxed">{o.desc}</p>
                <span class="mt-4 inline-flex items-center gap-1 text-sm text-cyan-400 group-hover:text-cyan-300">
                  {o.cta} →
                </span>
              </A>
            )}
          </For>
        </div>

        {/* Whitelabel / dedicated infrastructure */}
        <div class="mt-12">
          <WhitelabelSection />
        </div>

        {/* Staking — secondary */}
        <div class="mt-12">
          <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">Also</div>
          <A
            href="/software/vctl"
            class="group block rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors p-6"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-3">
                  <span class="i-mdi-shield-lock text-cyan-400 text-2xl" />
                  <h2 class="text-lg font-semibold text-white">Staking &amp; validators</h2>
                </div>
                <p class="text-sm text-gray-400 mt-2 max-w-xl">
                  Non-custodial validators on Polkadot, Kusama and Penumbra — nominate directly or via pools.
                </p>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold text-white font-mono">{totalValidators()}</div>
                <span class="text-xs text-gray-500">validators · </span>
                <span class="text-sm text-cyan-400 group-hover:text-cyan-300">Stake →</span>
              </div>
            </div>
          </A>
        </div>

        {/* Metrics strip */}
        <div class="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <For each={servicesData.stats}>
            {(stat) => (
              <div class="rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-4">
                <div class="text-2xl font-bold text-white font-mono">{stat.value}</div>
                <div class="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            )}
          </For>
        </div>

        {/* Contact CTA */}
        <div class="mt-12 rounded-xl border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
          <div class="max-w-xl">
            <h2 class="text-xl font-semibold text-white">{servicesData.cta.title}</h2>
            <p class="text-sm text-gray-400 mt-1">{servicesData.cta.description}</p>
          </div>
          <A
            href="/contact"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            Get in touch →
          </A>
        </div>
      </section>
    </MainLayout>
  )
}

export default ServicesPage
