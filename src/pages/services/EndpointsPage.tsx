import { Component, createSignal, createEffect, createMemo, For, Show, onCleanup } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import MainLayout from '../../layouts/MainLayout'
import { CHAINS, EndpointConfig, buildWssUrl, buildHttpsUrl, getHostname } from '../../data/endpoints-data'
import { fetchGatusHealth, EndpointHealth } from '../../services/gatus-service'

const EndpointsPage: Component = () => {
  const params = useParams()
  const [health, setHealth] = createSignal<Map<string, EndpointHealth>>(new Map())
  const [geodns, setGeodns] = createSignal(false)
  const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null)
  const [latencies, setLatencies] = createSignal<Map<string, { direct: number | null, geo: number | null }>>(new Map())
  const [healthLoaded, setHealthLoaded] = createSignal(false)

  const network = () => params.network?.toLowerCase() || 'polkadot'
  const config = () => CHAINS[network()] || CHAINS.polkadot
  const domain = () => geodns() ? 'dotters.network' : 'rotko.net'

  const loadHealth = async () => {
    try {
      const h = await fetchGatusHealth()
      setHealth(h)
      setHealthLoaded(true)
    } catch (e) {
      console.error('Failed to fetch health:', e)
    }
  }

  // measure latency from user's browser to both providers
  const measureLatency = async (endpoint: EndpointConfig) => {
    const slug = getHostname(endpoint)
    const measure = async (d: string): Promise<number | null> => {
      const url = `https://${slug}.${d}`
      try {
        const start = performance.now()
        await fetch(url, { method: 'HEAD', mode: 'no-cors' })
        return Math.round(performance.now() - start)
      } catch { return null }
    }

    const [direct, geo] = await Promise.all([
      measure('rotko.net'),
      endpoint.geodns !== false ? measure('dotters.network') : Promise.resolve(null),
    ])

    setLatencies(prev => {
      const next = new Map(prev)
      next.set(endpoint.slug, { direct, geo })
      return next
    })
  }

  const measureAll = async () => {
    const endpoints = config().endpoints
    await Promise.all(endpoints.map(ep => measureLatency(ep)))
  }

  createEffect(() => {
    const _ = network()
    setLatencies(new Map())
    loadHealth()
    measureAll()
  })

  const interval = setInterval(() => { loadHealth() }, 60_000)
  onCleanup(() => clearInterval(interval))

  const stats = createMemo(() => {
    const endpoints = config().endpoints
    const h = health()
    let online = 0
    let totalLatency = 0
    let latencyCount = 0
    let totalUptime = 0
    let uptimeCount = 0

    for (const ep of endpoints) {
      const status = h.get(ep.slug)
      if (status) {
        if (status.online) online++
        if (status.latencyMs != null) {
          totalLatency += status.latencyMs
          latencyCount++
        }
        totalUptime += status.uptimePercent
        uptimeCount++
      }
    }

    return {
      total: endpoints.length,
      online,
      avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : null,
      uptime: uptimeCount > 0 ? Math.round(totalUptime / uptimeCount * 10) / 10 : null,
    }
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(text)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'relay': return 'bg-cyan-900/50 text-cyan-400'
      case 'assetHub': return 'bg-purple-900/50 text-purple-400'
      case 'people': return 'bg-green-900/50 text-green-400'
      case 'bridge': return 'bg-orange-900/50 text-orange-400'
      case 'collectives': return 'bg-blue-900/50 text-blue-400'
      case 'coretime': return 'bg-pink-900/50 text-pink-400'
      case 'evm': return 'bg-yellow-900/50 text-yellow-400'
      case 'parachain': return 'bg-indigo-900/50 text-indigo-400'
      default: return 'bg-gray-800 text-gray-400'
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
        {/* Header */}
        <div class="border-b border-gray-800">
          <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="text-sm text-gray-500 mb-4">
              <A href="/services" class="hover:text-cyan-400">Services</A>
              <span class="mx-2">/</span>
              <span class="text-white">RPC Endpoints</span>
            </div>

            <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 class="text-2xl font-bold text-cyan-400">
                  {config().name} RPC Endpoints
                </h1>
                <p class="text-gray-500 text-sm mt-1">Public WebSocket and HTTPS endpoints with live health monitoring</p>
              </div>

              {/* GeoDNS toggle */}
              <button
                onClick={() => setGeodns(!geodns())}
                class={`flex items-center gap-2 px-4 py-2 text-sm border transition-colors ${
                  geodns()
                    ? 'border-cyan-600 bg-cyan-900/30 text-cyan-400'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span class={`w-2 h-2 rounded-full ${geodns() ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                GeoDNS
                <span class="text-xs text-gray-500">
                  {geodns() ? 'dotters.network' : 'rotko.net'}
                </span>
              </button>
            </div>

            {/* Network Tabs */}
            <div class="flex flex-wrap gap-2 mb-6">
              <For each={Object.entries(CHAINS)}>
                {([chainId, cfg]) => (
                  <A
                    href={`/services/endpoints/${chainId}`}
                    class={`px-4 py-2 text-sm transition-colors ${
                      network() === chainId
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {cfg.name}
                    <span class="ml-2 text-xs opacity-60">({cfg.endpoints.length})</span>
                  </A>
                )}
              </For>
            </div>

            {/* Stats Bar */}
            <Show when={healthLoaded()}>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-900 border border-gray-800 px-4 py-3">
                  <div class="text-2xl font-bold text-cyan-400 font-mono">{stats().total}</div>
                  <div class="text-xs text-gray-500">Endpoints</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 px-4 py-3">
                  <div class="text-2xl font-bold text-green-400 font-mono">{stats().online}</div>
                  <div class="text-xs text-gray-500">Online</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 px-4 py-3">
                  <div class={`text-2xl font-bold font-mono ${latencyColor(stats().avgLatency)}`}>
                    {stats().avgLatency != null ? `${stats().avgLatency}ms` : '—'}
                  </div>
                  <div class="text-xs text-gray-500">Avg Latency (server)</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 px-4 py-3">
                  <div class="text-2xl font-bold text-cyan-400 font-mono">
                    {stats().uptime != null ? `${stats().uptime}%` : '—'}
                  </div>
                  <div class="text-xs text-gray-500">Uptime</div>
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* Endpoints List */}
        <div class="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <For each={config().endpoints}>
            {(endpoint) => {
              const status = () => health().get(endpoint.slug)
              const lat = () => latencies().get(endpoint.slug)
              const wssUrl = () => buildWssUrl(endpoint, domain())
              const httpsUrl = () => buildHttpsUrl(endpoint, domain())
              const hasGeoDns = () => endpoint.geodns !== false

              return (
                <div class="bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
                  {/* Endpoint Header */}
                  <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
                    <div class="flex items-center gap-3">
                      {/* Status dot */}
                      <span class={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        !healthLoaded() ? 'bg-gray-600'
                        : status()?.online ? 'bg-green-400'
                        : status() ? 'bg-red-400'
                        : 'bg-gray-600'
                      }`} />
                      <h3 class="text-base font-semibold text-white">{endpoint.name}</h3>
                      <span class={`px-2 py-0.5 text-xs ${getTypeColor(endpoint.type)}`}>
                        {endpoint.type}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-xs font-mono">
                      <Show when={status()?.uptimePercent != null}>
                        <span class="text-gray-500">
                          {status()!.uptimePercent}% uptime
                        </span>
                      </Show>
                      {/* Client latencies */}
                      <Show when={lat()}>
                        <span class={latencyColor(lat()!.direct)}>
                          direct: {lat()!.direct != null ? `${lat()!.direct}ms` : '—'}
                        </span>
                        <Show when={hasGeoDns() && lat()!.geo != null}>
                          <span class={latencyColor(lat()!.geo)}>
                            geo: {lat()!.geo}ms
                          </span>
                        </Show>
                      </Show>
                    </div>
                  </div>

                  {/* Endpoint URLs */}
                  <div class="px-5 py-3 space-y-2">
                    {/* WSS */}
                    <Show when={endpoint.type !== 'evm'}>
                      <div class="flex items-center gap-3">
                        <span class="text-xs px-1.5 py-0.5 bg-cyan-900/40 text-cyan-400 font-mono w-12 text-center flex-shrink-0">WSS</span>
                        <code class="text-sm text-cyan-400 font-mono flex-1 min-w-0 truncate">{wssUrl()}</code>
                        <button
                          onClick={() => copyToClipboard(wssUrl())}
                          class={`px-2 py-1 text-xs flex-shrink-0 transition-colors ${
                            copiedUrl() === wssUrl()
                              ? 'bg-green-800 text-green-300'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                          }`}
                        >
                          {copiedUrl() === wssUrl() ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </Show>

                    {/* HTTPS */}
                    <div class="flex items-center gap-3">
                      <span class={`text-xs px-1.5 py-0.5 font-mono w-12 text-center flex-shrink-0 ${
                        endpoint.type === 'evm'
                          ? 'bg-yellow-900/40 text-yellow-400'
                          : 'bg-green-900/40 text-green-400'
                      }`}>
                        {endpoint.type === 'evm' ? 'RPC' : 'HTTP'}
                      </span>
                      <code class="text-sm text-cyan-400 font-mono flex-1 min-w-0 truncate">{httpsUrl()}</code>
                      <button
                        onClick={() => copyToClipboard(httpsUrl())}
                        class={`px-2 py-1 text-xs flex-shrink-0 transition-colors ${
                          copiedUrl() === httpsUrl()
                            ? 'bg-green-800 text-green-300'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                        }`}
                      >
                        {copiedUrl() === httpsUrl() ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    {/* Show alternate provider URL if available */}
                    <Show when={hasGeoDns()}>
                      <div class="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
                        <span class="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-500 font-mono w-12 text-center flex-shrink-0">
                          {geodns() ? 'ALT' : 'GEO'}
                        </span>
                        <code class="text-xs text-gray-500 font-mono flex-1 min-w-0 truncate">
                          {buildWssUrl(endpoint, geodns() ? 'rotko.net' : 'dotters.network')}
                        </code>
                        <button
                          onClick={() => copyToClipboard(buildWssUrl(endpoint, geodns() ? 'rotko.net' : 'dotters.network'))}
                          class="px-2 py-1 text-xs flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-500 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </Show>
                  </div>

                  {/* Usage */}
                  <details class="border-t border-gray-800/50">
                    <summary class="px-5 py-2 text-xs text-gray-500 cursor-pointer hover:text-cyan-400">
                      Usage examples
                    </summary>
                    <div class="px-5 pb-3 space-y-2">
                      <Show when={endpoint.type !== 'evm'}>
                        <div>
                          <div class="text-xs text-gray-600 mb-1">polkadot-api</div>
                          <code class="block p-2 bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                            {`const client = createClient(getWsProvider('${wssUrl()}'))`}
                          </code>
                        </div>
                      </Show>
                      <Show when={endpoint.type === 'evm'}>
                        <div>
                          <div class="text-xs text-gray-600 mb-1">viem / ethers</div>
                          <code class="block p-2 bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                            {`const provider = new JsonRpcProvider('${httpsUrl()}')`}
                          </code>
                        </div>
                      </Show>
                      <div>
                        <div class="text-xs text-gray-600 mb-1">curl</div>
                        <code class="block p-2 bg-black text-xs text-gray-300 overflow-x-auto font-mono">
                          {endpoint.type === 'evm'
                            ? `curl -X POST ${httpsUrl()} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
                            : `wscat -c ${wssUrl()}`
                          }
                        </code>
                      </div>
                    </div>
                  </details>
                </div>
              )
            }}
          </For>

          {/* Footer Info */}
          <div class="mt-8 p-4 bg-gray-900/50 border border-gray-800 text-sm text-gray-500">
            <h3 class="text-white font-semibold mb-2">Endpoint Features</h3>
            <ul class="space-y-1">
              <li>• <span class="text-cyan-400">rotko.net</span> — Direct connection via AS142108 (Helsinki)</li>
              <li>• <span class="text-cyan-400">dotters.network</span> — IBP GeoDNS with global anycast routing</li>
              <li>• <span class="text-yellow-400">EVM RPC</span> — Ethereum JSON-RPC via pallet-revive on Asset Hub</li>
              <li>• No rate limits for reasonable usage</li>
              <li>• Full archive node access</li>
              <li>• WebSocket and HTTPS support</li>
            </ul>
            <div class="mt-3 pt-3 border-t border-gray-800">
              <a href="https://status.rotko.net" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline text-xs">
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
