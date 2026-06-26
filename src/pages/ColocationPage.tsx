import { Component, createSignal, createMemo, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import OrderForm, { OS_OPTIONS } from '../components/OrderForm'
import { colocationData as C, PriceOption } from '../data/colocation-data'
import { rackConfiguration } from '../data/rack-config'

// Free units in the rack = the colocation inventory we can actually sell.
const freeUnits = (() => {
  const occ = new Set<number>()
  for (const d of rackConfiguration.devices) {
    for (let u = d.bottom_u; u < d.bottom_u + d.height_u; u++) occ.add(u)
  }
  return rackConfiguration.rack_u - occ.size
})()

const MAX_UNITS = Math.min(C.maxUnits, freeUnits)
const money = (n: number) => `$${n.toLocaleString('en-US')}`

const ColocationPage: Component = () => {
  const [units, setUnits] = createSignal(1)
  const [bandwidth, setBandwidth] = createSignal(C.bandwidth[0].id)
  const [power, setPower] = createSignal(C.power[0].id)
  const [ipv4, setIpv4] = createSignal(C.ipv4[0].id)
  const [ipv6, setIpv6] = createSignal(C.ipv6[0].id)
  const [addons, setAddons] = createSignal<Set<string>>(new Set())
  const [order, setOrder] = createSignal<{ title: string; summary: string[]; submitLabel?: string; sentLabel?: string; os?: boolean } | null>(null)

  const opt = (list: PriceOption[], id: string) => list.find(o => o.id === id)!

  const toggleAddon = (id: string) => {
    setAddons(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Line items for the summary + total. `quote` options contribute $0 to the
  // numeric total but flag the build as "quote required".
  const lines = createMemo(() => {
    const items: { label: string; price: number; quote?: boolean }[] = []
    items.push({ label: `Rack space, ${units()}U × ${money(C.perUnit)}`, price: units() * C.perUnit })

    const bw = opt(C.bandwidth, bandwidth())
    items.push({ label: `Bandwidth, ${bw.label}`, price: bw.price, quote: bw.quote })

    const pw = opt(C.power, power())
    items.push({ label: `Power, ${pw.label}`, price: pw.price, quote: pw.quote })

    const v4 = opt(C.ipv4, ipv4())
    if (v4.price > 0 || v4.quote) items.push({ label: `IPv4, ${v4.label}`, price: v4.price, quote: v4.quote })

    const v6 = opt(C.ipv6, ipv6())
    if (v6.price > 0) items.push({ label: `IPv6, ${v6.label}`, price: v6.price })

    for (const a of C.addons) {
      if (addons().has(a.id) && a.price > 0) items.push({ label: a.label, price: a.price })
    }
    return items
  })

  const total = createMemo(() => lines().reduce((s, l) => s + l.price, 0))
  const needsQuote = createMemo(() => lines().some(l => l.quote))

  const orderBuild = () => {
    setOrder({
      title: 'Colocation quote request',
      submitLabel: 'Send for a quote →',
      sentLabel: 'Request sent.',
      summary: [
        ...lines().map(l => `${l.label}: ${l.quote ? 'quote' : money(l.price) + '/mo'}`),
        `Indicative total: ${money(total())}/mo${needsQuote() ? ' + quoted items' : ''}`,
      ],
    })
  }

  // Shared control styling
  const optionRow = (selected: boolean) =>
    `flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
      selected ? 'border-cyan-600 bg-cyan-900/20' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
    }`

  const Radio = (props: { name: string; list: PriceOption[]; value: () => string; set: (v: string) => void }) => (
    <div class="space-y-2">
      <For each={props.list}>
        {(o) => (
          <label class={optionRow(props.value() === o.id)}>
            <div class="flex items-center gap-3 min-w-0">
              <input
                type="radio"
                name={props.name}
                checked={props.value() === o.id}
                onChange={() => props.set(o.id)}
                class="accent-cyan-500"
              />
              <div class="min-w-0">
                <div class="text-sm text-gray-200">{o.label}</div>
                <Show when={o.desc}><div class="text-xs text-gray-500">{o.desc}</div></Show>
              </div>
            </div>
            <div class="text-sm font-mono text-gray-400 flex-shrink-0">
              {o.quote ? 'quote' : o.price === 0 ? 'included' : `+${money(o.price)}`}
            </div>
          </label>
        )}
      </For>
    </div>
  )

  return (
    <MainLayout>
      <section class="pt-12 pb-16 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="text-sm text-gray-500 mb-4">
          <A href="/infrastructure" class="hover:text-cyan-400">Infrastructure</A>
          <span class="mx-2">/</span>
          <span class="text-gray-300">Colocation</span>
        </div>
        <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">Colocation</div>
        <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">Build your colocation</h1>
        <p class="text-lg text-gray-300 mt-5 max-w-2xl leading-relaxed">
          Put your hardware in our Bangkok rack on <span class="text-cyan-400">AS142108</span>, direct BGP,
          carrier-grade power, and your own IPv4/IPv6 space. Configure a build below for an indicative
          monthly price, then send it over for a firm quote.
        </p>

        {/* Bare metal, rent our hardware */}
        <div class="mt-12">
          <div class="flex items-baseline justify-between flex-wrap gap-2 mb-1">
            <h2 class="text-2xl font-bold text-white tracking-tight">Rent bare metal</h2>
            <span class="inline-flex items-center gap-1.5 text-sm text-cyan-400">
              <span class="i-mdi-truck-fast" /> {C.bareMetalDelivery}
            </span>
          </div>
          <p class="text-sm text-gray-400 mb-5 max-w-2xl">
            Dedicated physical servers on the same BGP fabric, single-tenant performance, routed
            /64 included, IPv4 on request, and <span class="text-gray-300">KVM/IPMI console access</span> on
            every machine for remote installs and recovery. Or bring your own hardware with the
            colocation builder below.
          </p>
          <div class="grid sm:grid-cols-3 gap-4">
            <For each={C.bareMetal}>
              {(m) => (
                <div class="rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors p-6 flex flex-col">
                  <h3 class="text-base font-semibold text-white">{m.cpu}</h3>
                  <div class="mt-1 text-xs text-gray-500">{m.cores}</div>
                  <ul class="mt-4 space-y-1.5 text-sm text-gray-300 flex-1">
                    <li class="flex justify-between"><span class="text-gray-500">RAM</span><span class="font-mono">{m.ram}</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">Storage</span><span class="font-mono">{m.disk}</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">IPv6</span><span class="font-mono">/64</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">Console</span><span class="font-mono">KVM/IPMI</span></li>
                  </ul>
                  <div class="mt-4">
                    <span class="text-2xl font-bold text-white font-mono">{money(m.price)}</span>
                    <span class="text-sm text-gray-500">/mo</span>
                  </div>
                  <button
                    onClick={() => setOrder({ title: `Bare metal, ${m.cpu}`, os: true, summary: [`${m.cpu} · ${m.cores}`, `RAM: ${m.ram}`, `Storage: ${m.disk}`, `Console: KVM/IPMI`, `Estimated: ${money(m.price)}/mo`] })}
                    class="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                  >
                    Request →
                  </button>
                </div>
              )}
            </For>
          </div>
          <p class="mt-3 text-xs text-gray-500">Indicative monthly pricing; custom builds (GPU, more disk, dual feed) on request.</p>
        </div>

        {/* Bring your own hardware, colocation builder */}
        <h2 class="mt-14 text-2xl font-bold text-white tracking-tight">Colocate your own hardware</h2>
        <p class="text-sm text-gray-400 mt-1 mb-2 max-w-2xl">Already have servers? Build a colocation package, units, power, bandwidth and IPs.</p>

        <div class="mt-6 grid lg:grid-cols-3 gap-8">
          {/* Configurator */}
          <div class="lg:col-span-2 space-y-10">
            {/* Units */}
            <div>
              <h2 class="text-sm font-semibold text-white uppercase tracking-wider mb-1">Rack space</h2>
              <p class="text-xs text-gray-500 mb-4">{freeUnits}U available today · {money(C.perUnit)} per U / month</p>
              <div class="flex items-center gap-4">
                <div class="inline-flex items-center rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
                  <button
                    class="px-4 py-2 text-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40"
                    onClick={() => setUnits(u => Math.max(1, u - 1))}
                    disabled={units() <= 1}
                    aria-label="Fewer units"
                  >−</button>
                  <span class="px-5 py-2 font-mono text-white tabular-nums">{units()}U</span>
                  <button
                    class="px-4 py-2 text-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40"
                    onClick={() => setUnits(u => Math.min(MAX_UNITS, u + 1))}
                    disabled={units() >= MAX_UNITS}
                    aria-label="More units"
                  >+</button>
                </div>
                <span class="text-sm text-gray-500">Need a full rack or cage? <A href="/contact" class="text-cyan-400 hover:text-cyan-300">ask us</A>.</span>
              </div>
            </div>

            {/* Bandwidth */}
            <div>
              <h2 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Bandwidth</h2>
              <Radio name="bandwidth" list={C.bandwidth} value={bandwidth} set={setBandwidth} />
            </div>

            {/* Power */}
            <div>
              <h2 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Power</h2>
              <Radio name="power" list={C.power} value={power} set={setPower} />
            </div>

            {/* IPv4 */}
            <div>
              <h2 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">IPv4 addresses</h2>
              <Radio name="ipv4" list={C.ipv4} value={ipv4} set={setIpv4} />
            </div>

            {/* IPv6 */}
            <div>
              <h2 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">IPv6 addresses</h2>
              <Radio name="ipv6" list={C.ipv6} value={ipv6} set={setIpv6} />
            </div>

            {/* Add-ons */}
            <div>
              <h2 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Add-ons</h2>
              <div class="space-y-2">
                <For each={C.addons}>
                  {(a) => (
                    <label class={optionRow(addons().has(a.id))}>
                      <div class="flex items-center gap-3 min-w-0">
                        <input type="checkbox" checked={addons().has(a.id)} onChange={() => toggleAddon(a.id)} class="accent-cyan-500" />
                        <div class="min-w-0">
                          <div class="text-sm text-gray-200">{a.label}</div>
                          <Show when={a.desc}><div class="text-xs text-gray-500">{a.desc}</div></Show>
                        </div>
                      </div>
                      <div class="text-sm font-mono text-gray-400 flex-shrink-0">{a.price === 0 ? 'included' : `+${money(a.price)}`}</div>
                    </label>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div class="lg:col-span-1">
            <div class="lg:sticky lg:top-24 rounded-xl border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-6">
              <h2 class="text-lg font-semibold text-white mb-4">Your build</h2>
              <div class="space-y-2 text-sm">
                <For each={lines()}>
                  {(l) => (
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400">{l.label}</span>
                      <span class="font-mono text-gray-300 flex-shrink-0">{l.quote ? 'quote' : `${money(l.price)}`}</span>
                    </div>
                  )}
                </For>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-800 flex items-end justify-between">
                <span class="text-sm text-gray-400">Indicative total</span>
                <span class="text-2xl font-bold text-white font-mono">{money(total())}<span class="text-sm text-gray-500">/mo</span></span>
              </div>
              <Show when={needsQuote()}>
                <p class="mt-2 text-xs text-cyan-400/80">+ quoted items above</p>
              </Show>

              <button
                onClick={orderBuild}
                class="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Send for a quote →
              </button>
              <p class="mt-3 text-xs text-gray-500 leading-relaxed">
                Colocation is custom-quoted, send us your build and we'll make you an offer
                (or counter yours). Smart hands ${C.smartHandsRequest}/request; cross-connect install
                quoted separately.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Show when={order()}>
        <OrderForm title={order()!.title} summary={order()!.summary} submitLabel={order()!.submitLabel} sentLabel={order()!.sentLabel} osOptions={order()!.os ? OS_OPTIONS : undefined} onClose={() => setOrder(null)} />
      </Show>
    </MainLayout>
  )
}

export default ColocationPage
