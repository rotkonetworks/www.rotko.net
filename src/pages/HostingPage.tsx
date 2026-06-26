import { Component, createSignal, createMemo, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import OrderForm, { OS_OPTIONS } from '../components/OrderForm'
import TrialSection from '../components/TrialSection'
import { hostingData as H } from '../data/hosting-data'

// Show cents only when needed (micro VMs land on e.g. $1.50).
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`

interface Order { title: string; summary: string[]; config: Record<string, unknown> }

const HostingPage: Component = () => {
  // Index into the fixed core-size ladder (0.25 → 16). Default 1 vCPU.
  const [coreIdx, setCoreIdx] = createSignal(H.coreOptions.findIndex(o => o.vcpu === 1))
  const [ramIdx, setRamIdx] = createSignal(H.ramOptions.indexOf(2))
  const [extraGb, setExtraGb] = createSignal(0)
  const [trafficTb, setTrafficTb] = createSignal(H.bandwidth.includedTb)
  const [nodeClass, setNodeClass] = createSignal(H.nodeClasses[0].id)
  const [ipv4, setIpv4] = createSignal(false)
  const [order, setOrder] = createSignal<Order | null>(null)

  const activeClass = createMemo(() => H.nodeClasses.find(n => n.id === nodeClass())!)

  // Selected core size and its automatic shared/dedicated classification.
  const core = () => H.coreOptions[coreIdx()]
  const vcpu = () => core().vcpu
  const dedicated = () => core().dedicated

  const ramGb = () => H.ramOptions[ramIdx()]
  const ramLabel = () => { const g = ramGb(); return g < 1 ? `${g * 1024} MB` : `${g} GB` }

  const stepCore = (dir: number) =>
    setCoreIdx(i => Math.min(H.coreOptions.length - 1, Math.max(0, i + dir)))
  const stepRam = (dir: number) =>
    setRamIdx(i => Math.min(H.ramOptions.length - 1, Math.max(0, i + dir)))

  const coreRate = () => dedicated() ? H.pricing.dedicatedCoreMonth : H.pricing.sharedCoreMonth
  const computeCost = () => vcpu() * coreRate() * activeClass().multiplier
  const ramCost = () => ramGb() * H.pricing.ramGbMonth
  const storageCost = () => extraGb() * (H.storage.perTbMonth / 1000)
  const bandwidthCost = () => Math.max(0, trafficTb() - H.bandwidth.includedTb) * H.bandwidth.perTbMonth
  const ipv4Cost = () => ipv4() ? H.ipv4Month : 0
  const total = createMemo(() => computeCost() + ramCost() + storageCost() + bandwidthCost() + ipv4Cost())
  const totalDiskGb = () => H.pricing.baseDiskGb + extraGb()

  const placeOrder = () => {
    setOrder({
      title: `VM order, ${vcpu()} vCPU · ${ramLabel()}`,
      summary: [
        `Compute: ${vcpu()} ${dedicated() ? 'dedicated' : 'shared'} vCPU on ${activeClass().cpu} (${activeClass().label})`,
        `RAM: ${ramLabel()}`,
        `NVMe: ${totalDiskGb().toLocaleString('en-US')} GB${extraGb() ? ` (incl. +${extraGb()} GB)` : ''}`,
        `IPv4: ${ipv4() ? 'yes (+1 address)' : 'no (IPv6-only, /64 included)'}`,
        `Traffic: ${trafficTb()} TB/mo`,
        `Estimated: ${money(total())}/mo`,
      ],
      // Structured build for /v1/orders — priced + validated server-side.
      config: {
        vcpu: vcpu(),
        ram_gb: ramGb(),
        extra_nvme_gb: extraGb(),
        traffic_tb: trafficTb(),
        ipv4: ipv4(),
        node_class: nodeClass(),
      },
    })
  }

  const stepBtn = 'px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent'
  const Stepper = (props: { value: string; dec: () => void; inc: () => void; decOff: boolean; incOff: boolean }) => (
    <div class="inline-flex items-center rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
      <button class={`${stepBtn} text-lg`} onClick={props.dec} disabled={props.decOff} aria-label="Decrease">−</button>
      <span class="px-4 py-1.5 font-mono text-white tabular-nums min-w-[88px] text-center">{props.value}</span>
      <button class={`${stepBtn} text-lg`} onClick={props.inc} disabled={props.incOff} aria-label="Increase">+</button>
    </div>
  )

  return (
    <MainLayout>
      <TrialSection />
      <section class="pt-12 pb-16 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="text-sm text-gray-500 mb-4">
          <A href="/services" class="hover:text-cyan-400">Services</A>
          <span class="mx-2">/</span>
          <span class="text-gray-300">Hosting</span>
        </div>
        <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">Cloud hosting</div>
        <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">Build a VM, exactly to spec</h1>
        <p class="text-lg text-gray-300 mt-5 max-w-2xl leading-relaxed">
          Pick a core size, the RAM, NVMe and traffic you need, and pay only for what you allocate.
          KVM on PCIe 4.0 NVMe, IPv6-first, routed on <span class="text-cyan-400">AS142108</span>.
        </p>

        <div class="mt-8 grid lg:grid-cols-3 gap-8">
          {/* Configurator */}
          <div class="lg:col-span-2 space-y-8">
            {/* vCPU — fixed sizes; shared/dedicated is automatic */}
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-white">vCPU</span>
                  <span class={`text-[10px] px-1.5 py-0.5 rounded border ${dedicated() ? 'border-cyan-700/50 bg-cyan-900/20 text-cyan-300' : 'border-gray-700 bg-gray-800/50 text-gray-400'}`}>
                    {dedicated() ? 'dedicated' : 'shared'}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {dedicated() ? 'Pinned core' : 'Oversubscribed (micro)'} · {money(coreRate() * activeClass().multiplier)}/core·mo
                </div>
              </div>
              <Stepper value={`${vcpu()} vCPU`} dec={() => stepCore(-1)} inc={() => stepCore(1)} decOff={coreIdx() <= 0} incOff={coreIdx() >= H.coreOptions.length - 1} />
            </div>

            {/* RAM */}
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-white">Memory</div>
                <div class="text-xs text-gray-500">{money(H.pricing.ramGbMonth)}/GB·mo</div>
              </div>
              <Stepper value={ramLabel()} dec={() => stepRam(-1)} inc={() => stepRam(1)} decOff={ramIdx() <= 0} incOff={ramIdx() >= H.ramOptions.length - 1} />
            </div>

            {/* NVMe */}
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-white">NVMe storage</div>
                <div class="text-xs text-gray-500">{H.pricing.baseDiskGb} GB included, then ${H.storage.perTbMonth}/TB·mo, PCIe 4.0 NVMe (6000 MB/s)</div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-mono text-gray-300">{totalDiskGb().toLocaleString('en-US')} GB</span>
                <Stepper value={`+${extraGb().toLocaleString('en-US')} GB`} dec={() => setExtraGb(g => Math.max(0, g - H.storage.stepGb))} inc={() => setExtraGb(g => Math.min(H.storage.maxGb, g + H.storage.stepGb))} decOff={extraGb() <= 0} incOff={extraGb() >= H.storage.maxGb} />
              </div>
            </div>

            {/* Traffic */}
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-white">Traffic</div>
                <div class="text-xs text-gray-500">{H.bandwidth.includedTb} TB included, then ${H.bandwidth.perTbMonth}/TB·mo</div>
              </div>
              <Stepper value={`${trafficTb()} TB`} dec={() => setTrafficTb(t => Math.max(H.bandwidth.includedTb, t - 1))} inc={() => setTrafficTb(t => Math.min(H.bandwidth.maxTb, t + 1))} decOff={trafficTb() <= H.bandwidth.includedTb} incOff={trafficTb() >= H.bandwidth.maxTb} />
            </div>

            {/* CPU class */}
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-white">CPU class</div>
                <div class="text-xs text-gray-500">{activeClass().cpu}</div>
              </div>
              <div class="inline-flex rounded-md border border-gray-700 overflow-hidden">
                <For each={H.nodeClasses}>
                  {(n) => (
                    <button class={`px-4 py-2 text-sm transition-colors ${nodeClass() === n.id ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} onClick={() => setNodeClass(n.id)}>
                      {n.label}
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* IPv4 */}
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-white">IPv4 address</div>
                <div class="text-xs text-gray-500">IPv6 /64 always included & free</div>
              </div>
              <button
                onClick={() => setIpv4(!ipv4())}
                class={`flex items-center gap-2 px-4 py-2 text-sm rounded-md border transition-colors ${ipv4() ? 'border-cyan-600 bg-cyan-900/30 text-cyan-400' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'}`}
              >
                <span class={`w-2 h-2 rounded-full ${ipv4() ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                {ipv4() ? 'Added' : 'Add'} (+{money(H.ipv4Month)}/mo)
              </button>
            </div>
          </div>

          {/* Summary */}
          <div class="lg:col-span-1">
            <div class="lg:sticky lg:top-24 rounded-xl border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-6">
              <h2 class="text-lg font-semibold text-white mb-4">Your VM</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-400">{vcpu()} {dedicated() ? 'dedicated' : 'shared'} vCPU</span><span class="font-mono text-gray-300">{money(computeCost())}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">{ramLabel()} RAM</span><span class="font-mono text-gray-300">{money(ramCost())}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">{totalDiskGb().toLocaleString('en-US')} GB NVMe</span><span class="font-mono text-gray-300">{extraGb() ? money(storageCost()) : 'incl.'}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">{trafficTb()} TB traffic</span><span class="font-mono text-gray-300">{bandwidthCost() ? money(bandwidthCost()) : 'incl.'}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">IPv4</span><span class="font-mono text-gray-300">{ipv4() ? money(ipv4Cost()) : '—'}</span></div>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-800 flex items-end justify-between">
                <span class="text-sm text-gray-400">Estimated</span>
                <span class="text-2xl font-bold text-white font-mono">{money(total())}<span class="text-sm text-gray-500">/mo</span></span>
              </div>
              <button onClick={placeOrder} class="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
                Deploy this VM →
              </button>
              <p class="mt-3 text-xs text-gray-500 leading-relaxed">Includes {H.bandwidth.includedTb} TB traffic. No charge yet, we confirm the build before provisioning.</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div class="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={H.features}>
            {(f) => (
              <div class="rounded-xl border border-gray-800 bg-gray-900/40 p-5 flex items-start gap-3">
                <span class={`${f.icon} text-cyan-400 text-xl mt-0.5`} />
                <div>
                  <div class="text-sm font-semibold text-white">{f.title}</div>
                  <div class="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Colo cross-sell */}
        <div class="mt-12 rounded-xl border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-white font-semibold">Need your own hardware instead?</h2>
            <p class="text-sm text-gray-400 mt-1">Rent bare metal or colocate in our Bangkok rack on the same BGP fabric.</p>
          </div>
          <A href="/colocation" class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-700 hover:border-gray-600 text-gray-200 transition-colors">
            Bare metal &amp; colocation →
          </A>
        </div>
      </section>

      <Show when={order()}>
        <OrderForm title={order()!.title} summary={order()!.summary} osOptions={OS_OPTIONS} product="vm" config={order()!.config} onClose={() => setOrder(null)} />
      </Show>
    </MainLayout>
  )
}

export default HostingPage
