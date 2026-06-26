import { Component, For } from 'solid-js'

interface Offering {
  icon: string
  title: string
  tagline: string
  features: string[]
}

const OFFERINGS: Offering[] = [
  {
    icon: 'i-mdi-server-network',
    title: 'Whitelabel RPC',
    tagline: 'Dedicated nodes under your own brand and domain.',
    features: [
      'Private capacity at rpc.yourbrand.com, your DNS, your TLS',
      'Full archive, custom rate policy, no noisy neighbours',
      'Substrate (WSS/HTTPS), EVM, and Penumbra gRPC',
      'Add our Bangkok PoP to your existing GeoDNS / multi-region setup',
    ],
  },
  {
    icon: 'i-mdi-shield-lock',
    title: 'Validator hosting',
    tagline: 'Managed validators on owned bare metal.',
    features: [
      'Sentried, high-availability setups with failover',
      'Key management, monitoring, alerting and upgrades',
      'SLA-backed uptime with real incident response',
      'Polkadot, Kusama, Penumbra and Cosmos-SDK chains',
    ],
  },
]

const Dingbat: Component = () => (
  <div class="text-center text-gray-700 tracking-[0.6em] select-none py-2" aria-hidden="true">· · ·</div>
)

const WhitelabelSection: Component = () => {
  return (
    <section class="rounded-xl border border-gray-800 bg-gray-900/30 px-6 py-10 md:px-10 md:py-12">
      {/* Editorial header */}
      <div class="max-w-3xl">
        <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-4">
          Whitelabel &amp; dedicated infrastructure
        </div>
        <h2 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Run it under your own brand
        </h2>
        <p class="mt-5 text-lg text-gray-300 leading-relaxed">
          Beyond our public endpoints, we operate dedicated RPC and validator infrastructure as a
          whitelabel service, your domain, your branding, our hardware and round-the-clock
          operations on <span class="text-cyan-400">AS142108</span> in Helsinki.
        </p>
      </div>

      <Dingbat />

      {/* Offerings */}
      <div class="grid gap-5 md:grid-cols-2">
        <For each={OFFERINGS}>
          {(o) => (
            <div class="rounded-lg border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-6">
              <div class="flex items-center gap-3 mb-2">
                <span class={`${o.icon} text-xl text-cyan-400`} />
                <h3 class="text-lg font-semibold text-white">{o.title}</h3>
              </div>
              <p class="text-sm text-gray-400 mb-4">{o.tagline}</p>
              <ul class="space-y-2">
                <For each={o.features}>
                  {(f) => (
                    <li class="flex items-start gap-2 text-sm text-gray-300">
                      <span class="i-mdi-check text-cyan-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          )}
        </For>
      </div>

      {/* CTA */}
      <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-gray-800">
        <p class="text-sm text-gray-400 flex-1">
          Tell us the chains, regions and SLA you need, you talk to the engineers who run the
          metal, not a sales team.
        </p>
        <div class="flex items-center gap-4 flex-shrink-0">
          <a
            href="/contact"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            <span class="i-mdi-email-outline" />
            Contact us
          </a>
        </div>
      </div>
    </section>
  )
}

export default WhitelabelSection
