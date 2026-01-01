import { Component, createSignal, createEffect, For, Show, onCleanup } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import MainLayout from '../../layouts/MainLayout'
import { CHAINS, ENDPOINT_PROVIDERS, buildEndpointUrl } from '../../data/endpoints-data'

interface EndpointStatus {
  url: string
  provider: string
  connected: boolean
  latency: number | null
  blockNumber: number | null
  error: string | null
}

const EndpointsPage: Component = () => {
  const params = useParams()
  const [statuses, setStatuses] = createSignal<Map<string, EndpointStatus>>(new Map())
  const [testing, setTesting] = createSignal(false)
  const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null)
  const clients: Map<string, any> = new Map()

  const network = () => params.network?.toLowerCase() || 'polkadot'
  const config = () => CHAINS[network()] || CHAINS.polkadot

  const testEndpoint = async (url: string, provider: string): Promise<EndpointStatus> => {
    const start = Date.now()
    try {
      if (url.startsWith('https://')) {
        // HTTP endpoint - just ping
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
        const latency = Date.now() - start
        return {
          url,
          provider,
          connected: true,
          latency,
          blockNumber: null,
          error: null
        }
      }

      const client = createClient(getWsProvider(url))
      clients.set(url, client)
      const api = await client.getUnsafeApi()
      const blockNumber = await api.query.System.Number.getValue()
      const latency = Date.now() - start

      return {
        url,
        provider,
        connected: true,
        latency,
        blockNumber: Number(blockNumber),
        error: null
      }
    } catch (err) {
      return {
        url,
        provider,
        connected: false,
        latency: null,
        blockNumber: null,
        error: err instanceof Error ? err.message : 'Connection failed'
      }
    }
  }

  const testAllEndpoints = async () => {
    setTesting(true)
    const cfg = config()
    const newStatuses = new Map<string, EndpointStatus>()

    for (const endpoint of cfg.endpoints) {
      // Test both providers in parallel
      const promises = ENDPOINT_PROVIDERS.map(async (provider) => {
        const url = buildEndpointUrl(endpoint.slug, provider.domain as 'dotters.network' | 'rotko.net')
        const status = await testEndpoint(url, provider.name)
        return { key: `${endpoint.slug}-${provider.domain}`, status }
      })

      const results = await Promise.all(promises)
      results.forEach(({ key, status }) => {
        newStatuses.set(key, status)
      })
      setStatuses(new Map(newStatuses))
    }

    setTesting(false)
  }

  createEffect(() => {
    const _ = network()
    setStatuses(new Map())
    for (const client of clients.values()) {
      try { client?.destroy?.() } catch (e) {}
    }
    clients.clear()
  })

  onCleanup(() => {
    for (const client of clients.values()) {
      try { client?.destroy?.() } catch (e) {}
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
      case 'parachain': return 'bg-indigo-900/50 text-indigo-400'
      default: return 'bg-gray-800 text-gray-400'
    }
  }

  const getLatencyColor = (latency: number | null) => {
    if (latency === null) return 'text-gray-500'
    if (latency < 200) return 'text-green-400'
    if (latency < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <MainLayout>
      <div class="min-h-screen">
        {/* Header */}
        <div class="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-black">
          <div class="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div class="text-sm text-gray-500 mb-4">
              <A href="/services" class="hover:text-cyan-400">Services</A>
              <span class="mx-2">/</span>
              <A href="/services/endpoints" class="hover:text-cyan-400">Endpoints</A>
              <span class="mx-2">/</span>
              <span class="text-white">{config().name}</span>
            </div>

            <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div class="flex items-center gap-4">
                <img src="/images/rotko-icon.svg" alt="Rotko" class="w-12 h-12" />
                <div>
                  <h1 class="text-2xl font-bold text-cyan-400">
                    {config().name} RPC Endpoints
                  </h1>
                  <p class="text-gray-400">Public WebSocket endpoints with latency comparison</p>
                </div>
              </div>
              <button
                onClick={testAllEndpoints}
                disabled={testing()}
                class={`px-4 py-2  text-sm transition-colors ${
                  testing()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {testing() ? 'Testing...' : 'Test All Endpoints'}
              </button>
            </div>

            {/* Provider Legend */}
            <div class="flex flex-wrap gap-4 mb-6 text-sm">
              <For each={ENDPOINT_PROVIDERS}>
                {(provider) => (
                  <div class="flex items-center gap-2">
                    <span class={`w-2 h-2 ${provider.domain === 'dotters.network' ? 'bg-cyan-500' : 'bg-purple-500'}`} />
                    <span class="text-gray-400">{provider.name}</span>
                    <span class="text-gray-600">({provider.description})</span>
                  </div>
                )}
              </For>
            </div>

            {/* Network Tabs */}
            <div class="flex flex-wrap gap-2">
              <For each={Object.entries(CHAINS)}>
                {([chainId, cfg]) => (
                  <A
                    href={`/services/endpoints/${chainId}`}
                    class={`px-4 py-2  text-sm transition-colors ${
                      network() === chainId
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {cfg.name}
                    <span class="ml-2 text-xs opacity-60">
                      ({cfg.endpoints.length})
                    </span>
                  </A>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Endpoints List */}
        <div class="max-w-6xl mx-auto px-4 py-8">
          <div class="space-y-6">
            <For each={config().endpoints}>
              {(endpoint) => {
                const getStatus = (provider: string) =>
                  statuses().get(`${endpoint.slug}-${provider}`)

                return (
                  <div class="p-6 bg-gray-900/50 border border-gray-800 ">
                    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div class="flex items-center gap-3">
                          <h3 class="text-lg font-semibold text-white">{endpoint.name}</h3>
                          <span class={`px-2 py-1 text-xs ${getTypeColor(endpoint.type)}`}>
                            {endpoint.type}
                          </span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">{endpoint.description}</p>
                      </div>
                    </div>

                    {/* Endpoint URLs for each provider */}
                    <div class="space-y-3">
                      <For each={ENDPOINT_PROVIDERS}>
                        {(provider) => {
                          const url = buildEndpointUrl(endpoint.slug, provider.domain as 'dotters.network' | 'rotko.net')
                          const status = getStatus(provider.domain)

                          // Skip dotters.network for zcash
                          if (endpoint.slug === 'zcash' && provider.domain === 'dotters.network') {
                            return null
                          }

                          // Skip dotters.network for parachains (only rotko.net)
                          if (endpoint.type === 'parachain' && provider.domain === 'dotters.network') {
                            return null
                          }

                          return (
                            <div class="flex items-center gap-3 p-3 bg-black ">
                              <span class={`w-2 h-2 flex-shrink-0 ${
                                provider.domain === 'dotters.network' ? 'bg-cyan-500' : 'bg-purple-500'
                              }`} />

                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                  <span class="text-xs text-gray-500">{provider.name}</span>
                                  <Show when={status}>
                                    <span class={`text-xs px-2 py-0.5 ${
                                      status!.connected
                                        ? 'bg-green-900/50 text-green-400'
                                        : 'bg-red-900/50 text-red-400'
                                    }`}>
                                      {status!.connected ? 'OK' : 'Failed'}
                                    </span>
                                    <Show when={status!.latency !== null}>
                                      <span class={`text-xs font-mono ${getLatencyColor(status!.latency)}`}>
                                        {status!.latency}ms
                                      </span>
                                    </Show>
                                    <Show when={status!.blockNumber !== null}>
                                      <span class="text-xs text-gray-600">
                                        #{status!.blockNumber?.toLocaleString()}
                                      </span>
                                    </Show>
                                  </Show>
                                </div>
                                <code class="text-sm text-cyan-400 font-mono break-all">
                                  {url}
                                </code>
                              </div>

                              <button
                                onClick={() => copyToClipboard(url)}
                                class={`px-3 py-1 text-xs transition-colors flex-shrink-0 ${
                                  copiedUrl() === url
                                    ? 'bg-green-800 text-green-300'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                }`}
                              >
                                {copiedUrl() === url ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          )
                        }}
                      </For>
                    </div>

                    {/* Usage Examples */}
                    <details class="mt-4">
                      <summary class="text-sm text-gray-400 cursor-pointer hover:text-cyan-400">
                        Usage Examples
                      </summary>
                      <div class="mt-3 space-y-3">
                        <div>
                          <div class="text-xs text-gray-500 mb-1">polkadot-api</div>
                          <code class="block p-2 bg-black text-xs text-gray-300 overflow-x-auto">
                            {`const client = createClient(getWsProvider('${buildEndpointUrl(endpoint.slug, 'dotters.network')}'))`}
                          </code>
                        </div>
                        <div>
                          <div class="text-xs text-gray-500 mb-1">wscat</div>
                          <code class="block p-2 bg-black text-xs text-gray-300 overflow-x-auto">
                            {`wscat -c ${buildEndpointUrl(endpoint.slug, 'rotko.net')}`}
                          </code>
                        </div>
                      </div>
                    </details>
                  </div>
                )
              }}
            </For>
          </div>

          {/* Info */}
          <div class="mt-8 p-4 bg-gray-900/50 border border-gray-800  text-sm text-gray-500">
            <h3 class="text-white font-semibold mb-2">Endpoint Features</h3>
            <ul class="space-y-1">
              <li>• <span class="text-cyan-400">dotters.network</span> - IBP GeoDNS with global anycast routing</li>
              <li>• <span class="text-purple-400">rotko.net</span> - Direct connection via AS142108</li>
              <li>• No rate limits for reasonable usage</li>
              <li>• Full archive node access</li>
              <li>• WebSocket and HTTP/2 support</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default EndpointsPage
