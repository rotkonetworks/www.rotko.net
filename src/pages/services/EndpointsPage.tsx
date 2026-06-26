import { Component, createSignal, createEffect, createMemo, For, Show, onCleanup } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../../layouts/MainLayout'
import { CHAINS, ChainConfig, EndpointConfig, buildWssUrl, buildHttpsUrl, getHostname, getKind } from '../../data/endpoints-data'
import { fetchGatusHealth, EndpointHealth } from '../../services/gatus-service'
import WhitelabelSection from '../../components/WhitelabelSection'

interface VisibleEndpoint {
  ecoKey: string
  cfg: ChainConfig
  endpoint: EndpointConfig
}

const EndpointsPage: Component = () => {
  const params = useParams()
  const [health, setHealth] = createSignal<Map<string, EndpointHealth>>(new Map())
  const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null)
  const [latencies, setLatencies] = createSignal<Map<string, { direct: number | null }>>(new Map())
  const [healthLoaded, setHealthLoaded] = createSignal(false)
  const [filter, setFilter] = createSignal('')

  // Optional ecosystem scope from the route (/services/endpoints/:network).
  // Falls back to "all" when the param is absent or unknown.
  const selectedEco = () => {
    const p = params.network?.toLowerCase()
    return p && CHAINS[p] ? p : null
  }
  const domain = () => 'rotko.net'

  // Ecosystems in scope (one section, or all of them).
  const ecosystems = createMemo<[string, ChainConfig][]>(() => {
    const eco = selectedEco()
    const all = Object.entries(CHAINS)
    return eco ? all.filter(([k]) => k === eco) : all
  })

  // Flat list of every endpoint currently in scope, after the text filter.
  const visible = createMemo<VisibleEndpoint[]>(() => {
    const q = filter().trim().toLowerCase()
    const out: VisibleEndpoint[] = []
    for (const [ecoKey, cfg] of ecosystems()) {
      for (const endpoint of cfg.endpoints) {
        if (q && !(
          endpoint.name.toLowerCase().includes(q) ||
          endpoint.slug.toLowerCase().includes(q) ||
          cfg.name.toLowerCase().includes(q)
        )) continue
        out.push({ ecoKey, cfg, endpoint })
      }
    }
    return out
  })

  const grouped = createMemo<[string, ChainConfig, EndpointConfig[]][]>(() => {
    const map = new Map<string, { cfg: ChainConfig, eps: EndpointConfig[] }>()
    for (const v of visible()) {
      if (!map.has(v.ecoKey)) map.set(v.ecoKey, { cfg: v.cfg, eps: [] })
      map.get(v.ecoKey)!.eps.push(v.endpoint)
    }
    return [...map.entries()].map(([k, { cfg, eps }]) => [k, cfg, eps] as [string, ChainConfig, EndpointConfig[]])
  })

  const loadHealth = async () => {
    try {
      const h = await fetchGatusHealth()
      setHealth(h)
      setHealthLoaded(true)
    } catch (e) {
      console.error('Failed to fetch health:', e)
    }
  }

  // measure latency from the user's browser to the rotko.net endpoint
  const measureLatency = async (endpoint: EndpointConfig) => {
    const slug = getHostname(endpoint)
    let direct: number | null = null
    try {
      const start = performance.now()
      await fetch(`https://${slug}.rotko.net`, { method: 'HEAD', mode: 'no-cors' })
      direct = Math.round(performance.now() - start)
    } catch { direct = null }

    setLatencies(prev => {
      const next = new Map(prev)
      next.set(endpoint.slug, { direct })
      return next
    })
  }

  // Measure every endpoint in the current ecosystem scope (ignoring the
  // text filter, which is purely visual) so the filter doesn't re-trigger
  // a fresh round of latency probes on every keystroke.
  const measureAll = async () => {
    const eps = ecosystems().flatMap(([, cfg]) => cfg.endpoints)
    await Promise.all(eps.map(ep => measureLatency(ep)))
  }

  createEffect(() => {
    void ecosystems()
    setLatencies(new Map())
    loadHealth()
    measureAll()
  })

  const interval = setInterval(() => { loadHealth() }, 60_000)
  onCleanup(() => clearInterval(interval))

  const stats = createMemo(() => {
    const eps = visible()
    const h = health()
    let online = 0, tracked = 0
    let totalLatency = 0, latencyCount = 0
    let totalUptime = 0, uptimeCount = 0

    for (const { endpoint } of eps) {
      if (endpoint.health === false) continue
      const status = h.get(endpoint.slug)
      if (status) {
        tracked++
        if (status.online) online++
        if (status.latencyMs != null) { totalLatency += status.latencyMs; latencyCount++ }
        totalUptime += status.uptimePercent; uptimeCount++
      }
    }

    return {
      total: eps.length,
      online,
      tracked,
      avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : null,
      uptime: uptimeCount > 0 ? Math.round(totalUptime / uptimeCount * 10) / 10 : null,
    }
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(text)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const typeLabel: Record<string, string> = {
    relay: 'Relay', assetHub: 'Asset Hub', people: 'People', bridge: 'Bridge Hub',
    collectives: 'Collectives', coretime: 'Coretime', evm: 'EVM', parachain: 'Parachain',
    sovereign: 'Sovereign',
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'relay': return 'border-cyan-700/50 bg-cyan-900/20 text-cyan-300'
      case 'assetHub': return 'border-purple-700/50 bg-purple-900/20 text-purple-300'
      case 'people': return 'border-green-700/50 bg-green-900/20 text-green-300'
      case 'bridge': return 'border-orange-700/50 bg-orange-900/20 text-orange-300'
      case 'collectives': return 'border-blue-700/50 bg-blue-900/20 text-blue-300'
      case 'coretime': return 'border-pink-700/50 bg-pink-900/20 text-pink-300'
      case 'evm': return 'border-yellow-700/50 bg-yellow-900/20 text-yellow-300'
      case 'sovereign': return 'border-fuchsia-700/50 bg-fuchsia-900/20 text-fuchsia-300'
      default: return 'border-gray-700 bg-gray-800/50 text-gray-400'
    }
  }

  const latencyColor = (ms: number | null) => {
    if (ms == null) return 'text-gray-600'
    if (ms < 200) return 'text-green-400'
    if (ms < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <MainLayout>
      <div class="min-h-screen">
        {/* Hero */}
        <div class="border-b border-gray-800 bg-gradient-to-b from-gray-900/40 to-transparent">
          <div class="max-w-6xl mx-auto px-4 py-12">
            <div class="text-sm text-gray-500 mb-4">
              <A href="/services" class="hover:text-cyan-400">Services</A>
              <span class="mx-2">/</span>
              <span class="text-gray-300">RPC Endpoints</span>
            </div>

            <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">
              Public endpoints
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">
              High-availability RPC endpoints
            </h1>
            <p class="text-lg text-gray-300 mt-5 max-w-2xl leading-relaxed">
              Public WebSocket, HTTPS and gRPC endpoints across the Polkadot ecosystem and Penumbra,
              all served under <span class="text-cyan-400">*.rotko.net</span> from owned hardware on
              <span class="text-cyan-400"> AS142108</span> in Helsinki, with live health monitoring.
            </p>

            {/* Trust signals */}
            <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <span class="i-mdi-database text-cyan-400 text-xl mt-0.5" />
                <div>
                  <div class="text-sm font-semibold text-white">Full archive</div>
                  <div class="text-xs text-gray-500">Complete state history</div>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <span class="i-mdi-tag-outline text-cyan-400 text-xl mt-0.5" />
                <div>
                  <div class="text-sm font-semibold text-white">Free &amp; paid tiers</div>
                  <div class="text-xs text-gray-500">Public free, dedicated on request</div>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <span class="i-mdi-harddisk text-cyan-400 text-xl mt-0.5" />
                <div>
                  <div class="text-sm font-semibold text-white">Max IOPS</div>
                  <div class="text-xs text-gray-500">NVMe-backed archive storage</div>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <span class="i-mdi-pulse text-cyan-400 text-xl mt-0.5" />
                <div>
                  <div class="text-sm font-semibold text-white">Live health</div>
                  <div class="text-xs text-gray-500">Monitored every minute</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div class="border-b border-gray-800 sticky top-16 z-30 bg-gray-950/90 backdrop-blur-md">
          <div class="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
            {/* Ecosystem scope */}
            <div class="flex flex-wrap gap-1.5">
              <A
                href="/services/endpoints"
                class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  !selectedEco() ? 'bg-cyan-600 text-white' : 'bg-gray-800/70 text-gray-400 hover:bg-gray-800'
                }`}
              >
                All
              </A>
              <For each={Object.entries(CHAINS)}>
                {([chainId, cfg]) => (
                  <A
                    href={`/services/endpoints/${chainId}`}
                    class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedEco() === chainId ? 'bg-cyan-600 text-white' : 'bg-gray-800/70 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {cfg.name}
                  </A>
                )}
              </For>
            </div>

            {/* Filter */}
            <label class="flex-1 min-w-[180px] max-w-xs flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900 focus-within:border-cyan-600 transition-colors ml-auto">
              <span class="i-mdi-magnify text-gray-500" />
              <input
                type="search"
                placeholder="Filter chains…"
                value={filter()}
                onInput={(e) => setFilter(e.currentTarget.value)}
                class="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
                aria-label="Filter chains"
              />
            </label>
          </div>
        </div>

        {/* Stats bar */}
        <div class="max-w-6xl mx-auto px-4 pt-8">
          <Show when={healthLoaded()}>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <div class="text-2xl font-bold text-white font-mono">{stats().total}</div>
                <div class="text-xs text-gray-500">Endpoints</div>
              </div>
              <div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <div class="text-2xl font-bold text-green-400 font-mono">{stats().online}<span class="text-sm text-gray-600">/{stats().tracked}</span></div>
                <div class="text-xs text-gray-500">Online</div>
              </div>
              <div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <div class={`text-2xl font-bold font-mono ${latencyColor(stats().avgLatency)}`}>
                  {stats().avgLatency != null ? `${stats().avgLatency}ms` : '—'}
                </div>
                <div class="text-xs text-gray-500">Avg latency (server)</div>
              </div>
              <div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <div class="text-2xl font-bold text-cyan-400 font-mono">
                  {stats().uptime != null ? `${stats().uptime}%` : '—'}
                </div>
                <div class="text-xs text-gray-500">Uptime</div>
              </div>
            </div>
          </Show>
        </div>

        {/* Sections */}
        <div class="max-w-6xl mx-auto px-4 py-8 space-y-12">
          <Show when={visible().length > 0} fallback={
            <p class="text-gray-500 py-16 text-center">No chains match “{filter()}”.</p>
          }>
            <For each={grouped()}>
              {([_ecoKey, cfg, eps]) => (
                <section>
                  <div class="mb-4">
                    <h2 class="text-xl font-bold text-white flex items-baseline gap-3">
                      {cfg.name}
                      <span class="text-sm text-gray-600 font-normal">{eps.length} {eps.length === 1 ? 'endpoint' : 'endpoints'}</span>
                    </h2>
                    <p class="text-sm text-gray-500 mt-1 max-w-3xl">{cfg.blurb}</p>
                  </div>

                  <div class="grid gap-4 lg:grid-cols-2">
                    <For each={eps}>
                      {(endpoint) => {
                        const kind = getKind(endpoint)
                        const status = () => health().get(endpoint.slug)
                        const lat = () => latencies().get(endpoint.slug)
                        const wssUrl = () => buildWssUrl(endpoint, domain())
                        const httpsUrl = () => buildHttpsUrl(endpoint, domain())
                        const tracked = () => endpoint.health !== false

                        return (
                          <div class="rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors overflow-hidden">
                            {/* Card header */}
                            <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
                              <div class="flex items-center gap-3 min-w-0">
                                <span
                                  class={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    !tracked() ? 'bg-gray-600'
                                    : !healthLoaded() ? 'bg-gray-600'
                                    : status()?.online ? 'bg-green-400'
                                    : status() ? 'bg-red-400'
                                    : 'bg-gray-600'
                                  }`}
                                  title={tracked() ? 'Live health monitored' : 'Not in health monitor'}
                                />
                                <h3 class="text-base font-semibold text-white truncate">{endpoint.name}</h3>
                                <span class={`px-2 py-0.5 text-xs rounded border ${getTypeColor(endpoint.type)}`}>
                                  {typeLabel[endpoint.type] ?? endpoint.type}
                                </span>
                              </div>
                              <div class="flex items-center gap-3 text-xs font-mono flex-shrink-0">
                                <Show when={status()?.uptimePercent != null}>
                                  <span class="text-gray-500">{status()!.uptimePercent}%</span>
                                </Show>
                                <Show when={lat()}>
                                  <span class={latencyColor(lat()!.direct)}>
                                    {lat()!.direct != null ? `${lat()!.direct}ms` : '—'}
                                  </span>
                                </Show>
                              </div>
                            </div>

                            <p class="px-5 pt-3 text-xs text-gray-500">{endpoint.description}</p>

                            {/* URLs */}
                            <div class="px-5 py-3 space-y-2">
                              {/* WSS, substrate only */}
                              <Show when={kind === 'substrate'}>
                                <div class="flex items-center gap-3">
                                  <span class="text-xs px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-400 font-mono w-14 text-center flex-shrink-0">WSS</span>
                                  <code class="text-sm text-cyan-300 font-mono flex-1 min-w-0 truncate">{wssUrl()}</code>
                                  <button
                                    onClick={() => copyToClipboard(wssUrl())}
                                    class={`px-2 py-1 text-xs rounded flex-shrink-0 transition-colors ${
                                      copiedUrl() === wssUrl() ? 'bg-green-800 text-green-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                    }`}
                                  >
                                    {copiedUrl() === wssUrl() ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </Show>

                              {/* HTTPS / RPC / gRPC */}
                              <div class="flex items-center gap-3">
                                <span class={`text-xs px-1.5 py-0.5 rounded font-mono w-14 text-center flex-shrink-0 ${
                                  kind === 'evm' || kind === 'rpc' ? 'bg-yellow-900/40 text-yellow-400'
                                  : kind === 'penumbra' || kind === 'zcash' ? 'bg-fuchsia-900/40 text-fuchsia-300'
                                  : 'bg-green-900/40 text-green-400'
                                }`}>
                                  {kind === 'evm' || kind === 'rpc' ? 'RPC' : kind === 'penumbra' || kind === 'zcash' ? 'gRPC' : 'HTTP'}
                                </span>
                                <code class="text-sm text-cyan-300 font-mono flex-1 min-w-0 truncate">{httpsUrl()}</code>
                                <button
                                  onClick={() => copyToClipboard(httpsUrl())}
                                  class={`px-2 py-1 text-xs rounded flex-shrink-0 transition-colors ${
                                    copiedUrl() === httpsUrl() ? 'bg-green-800 text-green-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                  }`}
                                >
                                  {copiedUrl() === httpsUrl() ? 'Copied' : 'Copy'}
                                </button>
                              </div>

                              {/* Alias hostnames */}
                              <Show when={endpoint.aliases && endpoint.aliases.length}>
                                <div class="text-xs text-gray-500 pl-[3.75rem]">
                                  also: <For each={endpoint.aliases}>{(a, i) => (
                                    <>{i() > 0 ? ', ' : ''}<code class="text-gray-400 font-mono">{a}.{domain()}</code></>
                                  )}</For>
                                </div>
                              </Show>
                            </div>

                            {/* Usage */}
                            <details class="border-t border-gray-800/60">
                              <summary class="px-5 py-2 text-xs text-gray-500 cursor-pointer hover:text-cyan-400 flex items-center justify-between">
                                <span>Usage examples</span>
                                <Show when={endpoint.infoUrl}>
                                  <a
                                    href={endpoint.infoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    class="text-gray-600 hover:text-cyan-400"
                                  >
                                    Learn more →
                                  </a>
                                </Show>
                              </summary>
                              <div class="px-5 pb-3 space-y-2">
                                <Show when={kind === 'substrate'}>
                                  <div>
                                    <div class="text-xs text-gray-600 mb-1">polkadot-api</div>
                                    <code class="block p-2 rounded bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                                      {`const client = createClient(getWsProvider('${wssUrl()}'))`}
                                    </code>
                                  </div>
                                </Show>
                                <Show when={kind === 'evm'}>
                                  <div>
                                    <div class="text-xs text-gray-600 mb-1">viem / ethers</div>
                                    <code class="block p-2 rounded bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                                      {`const provider = new JsonRpcProvider('${httpsUrl()}')`}
                                    </code>
                                  </div>
                                </Show>
                                <Show when={kind === 'penumbra'}>
                                  <div>
                                    <div class="text-xs text-gray-600 mb-1">pcli</div>
                                    <code class="block p-2 rounded bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                                      {`pcli init --grpc-url ${httpsUrl()} soft-kdf`}
                                    </code>
                                  </div>
                                  <p class="text-xs text-gray-600">
                                    Or set <code class="text-gray-400 font-mono">{httpsUrl()}</code> as the RPC in the Prax browser wallet.
                                  </p>
                                </Show>
                                <Show when={kind === 'zcash'}>
                                  <p class="text-xs text-gray-600">
                                    Point a Zcash wallet (Zashi, Ywallet) or indexer at <code class="text-gray-400 font-mono">{httpsUrl()}</code> as its lightwalletd server.
                                  </p>
                                </Show>
                                <Show when={kind === 'substrate' || kind === 'evm'}>
                                  <div>
                                    <div class="text-xs text-gray-600 mb-1">curl</div>
                                    <code class="block p-2 rounded bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                                      {kind === 'evm'
                                        ? `curl -X POST ${httpsUrl()} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
                                        : `wscat -c ${wssUrl()}`}
                                    </code>
                                  </div>
                                </Show>
                                <Show when={kind === 'rpc'}>
                                  <div>
                                    <div class="text-xs text-gray-600 mb-1">curl (JSON-RPC)</div>
                                    <code class="block p-2 rounded bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                                      {`curl -X POST ${httpsUrl()} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"${endpoint.rpcMethod || 'getblockchaininfo'}","params":[]}'`}
                                    </code>
                                  </div>
                                </Show>
                              </div>
                            </details>
                          </div>
                        )
                      }}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </Show>

          {/* Whitelabel / dedicated infrastructure */}
          <WhitelabelSection />

          {/* Footer info */}
          <div class="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
            <h3 class="text-white font-semibold mb-3">How it works</h3>
            <ul class="space-y-1.5">
              <li>• <span class="text-cyan-400">*.rotko.net</span>, direct connection to our nodes via AS142108 (Helsinki). One domain, every chain.</li>
              <li>• <span class="text-yellow-400">EVM RPC</span>, Ethereum JSON-RPC via pallet-revive on Asset Hub.</li>
              <li>• <span class="text-fuchsia-300">Penumbra gRPC</span>, pd endpoint for pcli, the Prax wallet, and view services.</li>
              <li>• Full archive node access. No keys, no rate limits for reasonable usage.</li>
            </ul>
            <div class="mt-4 pt-4 border-t border-gray-800">
              <a href="https://status.rotko.net" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 text-xs">
                Live health monitoring →
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default EndpointsPage
