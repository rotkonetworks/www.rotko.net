import { Component, createSignal, createEffect, For, Show, onCleanup } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import MainLayout from '../../layouts/MainLayout'

interface ChainConfig {
  name: string
  endpoints: {
    name: string
    url: string
    type: 'relay' | 'assetHub' | 'people' | 'bridge' | 'collectives'
    description: string
  }[]
  ss58: number
  decimals: number
  token: string
  color: string
}

const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    endpoints: [
      { name: 'Relay Chain', url: 'wss://polkadot.dotters.network', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', url: 'wss://asset-hub-polkadot.dotters.network', type: 'assetHub', description: 'Assets, staking, and system parachains' },
      { name: 'People Chain', url: 'wss://people-polkadot.dotters.network', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', url: 'wss://bridge-hub-polkadot.dotters.network', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Collectives', url: 'wss://collectives-polkadot.dotters.network', type: 'collectives', description: 'Fellowship and governance' },
    ],
    ss58: 0,
    decimals: 10,
    token: 'DOT',
    color: 'pink'
  },
  kusama: {
    name: 'Kusama',
    endpoints: [
      { name: 'Relay Chain', url: 'wss://kusama.dotters.network', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', url: 'wss://asset-hub-kusama.dotters.network', type: 'assetHub', description: 'Assets, staking, and system parachains' },
      { name: 'People Chain', url: 'wss://people-kusama.dotters.network', type: 'people', description: 'Identity and people chain' },
      { name: 'Bridge Hub', url: 'wss://bridge-hub-kusama.dotters.network', type: 'bridge', description: 'Cross-chain bridge infrastructure' },
      { name: 'Coretime', url: 'wss://coretime-kusama.dotters.network', type: 'collectives', description: 'Coretime marketplace' },
    ],
    ss58: 2,
    decimals: 12,
    token: 'KSM',
    color: 'gray'
  },
  paseo: {
    name: 'Paseo',
    endpoints: [
      { name: 'Relay Chain', url: 'wss://paseo.dotters.network', type: 'relay', description: 'Main relay chain RPC' },
      { name: 'Asset Hub', url: 'wss://asset-hub-paseo.dotters.network', type: 'assetHub', description: 'Assets, staking, and system parachains' },
      { name: 'People Chain', url: 'wss://people-paseo.dotters.network', type: 'people', description: 'Identity and people chain' },
    ],
    ss58: 0,
    decimals: 10,
    token: 'PAS',
    color: 'green'
  }
}

interface EndpointStatus {
  url: string
  connected: boolean
  latency: number | null
  blockNumber: number | null
  error: string | null
}

const EndpointsPage: Component = () => {
  const params = useParams()
  const [statuses, setStatuses] = createSignal<Map<string, EndpointStatus>>(new Map())
  const [testing, setTesting] = createSignal(false)
  const clients: Map<string, any> = new Map()

  const network = () => params.network?.toLowerCase() || 'polkadot'
  const config = () => CHAINS[network()] || CHAINS.polkadot

  const testEndpoint = async (url: string): Promise<EndpointStatus> => {
    const start = Date.now()
    try {
      const client = createClient(getWsProvider(url))
      clients.set(url, client)
      const api = await client.getUnsafeApi()
      const blockNumber = await api.query.System.Number.getValue()
      const latency = Date.now() - start

      return {
        url,
        connected: true,
        latency,
        blockNumber: Number(blockNumber),
        error: null
      }
    } catch (err) {
      return {
        url,
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
      const status = await testEndpoint(endpoint.url)
      newStatuses.set(endpoint.url, status)
      setStatuses(new Map(newStatuses))
    }

    setTesting(false)
  }

  createEffect(() => {
    const _ = network() // track changes
    // Clear old statuses when switching networks
    setStatuses(new Map())
    // Cleanup old clients
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
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'relay': return 'bg-cyan-900/50 text-cyan-400'
      case 'assetHub': return 'bg-purple-900/50 text-purple-400'
      case 'people': return 'bg-green-900/50 text-green-400'
      case 'bridge': return 'bg-orange-900/50 text-orange-400'
      case 'collectives': return 'bg-blue-900/50 text-blue-400'
      default: return 'bg-gray-800 text-gray-400'
    }
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
                  <p class="text-gray-400">High-performance WebSocket endpoints</p>
                </div>
              </div>
              <button
                onClick={testAllEndpoints}
                disabled={testing()}
                class={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  testing()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {testing() ? 'Testing...' : 'Test All Endpoints'}
              </button>
            </div>

            {/* Network Tabs */}
            <div class="flex flex-wrap gap-2">
              <For each={Object.entries(CHAINS)}>
                {([chainId, cfg]) => (
                  <A
                    href={`/services/endpoints/${chainId}`}
                    class={`px-4 py-2 rounded-lg text-sm transition-colors ${
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
          <div class="space-y-4">
            <For each={config().endpoints}>
              {(endpoint) => {
                const status = () => statuses().get(endpoint.url)
                return (
                  <div class="p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
                    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div class="flex items-center gap-3">
                          <h3 class="text-lg font-semibold text-white">{endpoint.name}</h3>
                          <span class={`px-2 py-1 text-xs rounded ${getTypeColor(endpoint.type)}`}>
                            {endpoint.type}
                          </span>
                          <Show when={status()}>
                            <span class={`px-2 py-1 text-xs rounded ${
                              status()!.connected
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-red-900/50 text-red-400'
                            }`}>
                              {status()!.connected ? 'Connected' : 'Failed'}
                            </span>
                          </Show>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">{endpoint.description}</p>
                      </div>
                      <Show when={status()?.connected}>
                        <div class="text-right text-sm">
                          <div class="text-gray-500">Latency</div>
                          <div class={`font-mono ${
                            status()!.latency! < 100 ? 'text-green-400' :
                            status()!.latency! < 300 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {status()!.latency}ms
                          </div>
                        </div>
                      </Show>
                    </div>

                    {/* URL */}
                    <div class="flex items-center gap-2 p-3 bg-black rounded-lg">
                      <code class="flex-1 text-sm text-cyan-400 font-mono overflow-x-auto">
                        {endpoint.url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(endpoint.url)}
                        class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>

                    {/* Status Details */}
                    <Show when={status()}>
                      <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <Show when={status()!.connected}>
                          <div>
                            <div class="text-gray-500">Block</div>
                            <div class="text-white font-mono">#{status()!.blockNumber?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div class="text-gray-500">Protocol</div>
                            <div class="text-white">WebSocket</div>
                          </div>
                        </Show>
                        <Show when={status()!.error}>
                          <div class="col-span-full">
                            <div class="text-red-400 text-sm">{status()!.error}</div>
                          </div>
                        </Show>
                      </div>
                    </Show>

                    {/* Usage Examples */}
                    <details class="mt-4">
                      <summary class="text-sm text-gray-400 cursor-pointer hover:text-cyan-400">
                        Usage Examples
                      </summary>
                      <div class="mt-3 space-y-3">
                        <div>
                          <div class="text-xs text-gray-500 mb-1">polkadot-api</div>
                          <code class="block p-2 bg-black rounded text-xs text-gray-300 overflow-x-auto">
                            {`const client = createClient(getWsProvider('${endpoint.url}'))`}
                          </code>
                        </div>
                        <div>
                          <div class="text-xs text-gray-500 mb-1">wscat</div>
                          <code class="block p-2 bg-black rounded text-xs text-gray-300 overflow-x-auto">
                            {`wscat -c ${endpoint.url}`}
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
          <div class="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-500">
            <h3 class="text-white font-semibold mb-2">Endpoint Features</h3>
            <ul class="space-y-1">
              <li>• Direct BGP routing via AS142108</li>
              <li>• No rate limits for reasonable usage</li>
              <li>• Full archive node access</li>
              <li>• WebSocket and HTTP/2 support</li>
              <li>• Anycast failover for high availability</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default EndpointsPage
