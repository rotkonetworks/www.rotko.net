import { Component, createSignal, createEffect, For, Show } from 'solid-js'
import { multiChainServicePapi, type DiscoveredAccount, type AccountRelationship } from '../../services/multi-chain-service-papi'
import type { ChainConfig, InjectedAccountWithMeta } from '../../types/polkadot'

interface AccountDiscoveryProps {
  accounts: InjectedAccountWithMeta[]
  config: ChainConfig
  onAddAccount?: (address: string, name: string) => void
}

export const AccountDiscovery: Component<AccountDiscoveryProps> = (props) => {
  const [scanning, setScanning] = createSignal(false)
  const [discovered, setDiscovered] = createSignal<DiscoveredAccount[]>([])
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  const [error, setError] = createSignal<string | null>(null)

  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`

  const getRelationshipIcon = (type: AccountRelationship['type']) => {
    switch (type) {
      case 'sub-identity': return '↑'
      case 'parent-identity': return '↓'
      case 'has-proxy': return '→'
      case 'proxy-for': return '←'
    }
  }

  const getRelationshipColor = (type: AccountRelationship['type']) => {
    switch (type) {
      case 'sub-identity': return 'text-purple-400'
      case 'parent-identity': return 'text-purple-400'
      case 'has-proxy': return 'text-cyan-400'
      case 'proxy-for': return 'text-green-400'
    }
  }

  const getRelationshipLabel = (type: AccountRelationship['type']) => {
    switch (type) {
      case 'sub-identity': return 'Parent'
      case 'parent-identity': return 'Sub-identity'
      case 'has-proxy': return 'Has proxy'
      case 'proxy-for': return 'Proxy for'
    }
  }

  const scanAccounts = async () => {
    if (props.accounts.length === 0) return

    setScanning(true)
    setError(null)
    setDiscovered([])

    try {
      const allDiscovered: Map<string, DiscoveredAccount> = new Map()

      // Scan each connected account
      for (const account of props.accounts) {
        console.log(`Scanning account: ${account.address.slice(0, 8)}...`)
        const related = await multiChainServicePapi.discoverRelatedAccounts(account.address)

        for (const acc of related) {
          if (!allDiscovered.has(acc.address)) {
            allDiscovered.set(acc.address, acc)
          } else {
            // Merge relationships
            const existing = allDiscovered.get(acc.address)!
            for (const rel of acc.relationships) {
              const exists = existing.relationships.find(
                r => r.type === rel.type && r.relatedAddress === rel.relatedAddress
              )
              if (!exists) {
                existing.relationships.push(rel)
              }
            }
          }
        }
      }

      setDiscovered(Array.from(allDiscovered.values()))
    } catch (err) {
      console.error('Account discovery failed:', err)
      setError(err instanceof Error ? err.message : 'Discovery failed')
    } finally {
      setScanning(false)
    }
  }

  const toggleExpanded = (address: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(address)) {
        next.delete(address)
      } else {
        next.add(address)
      }
      return next
    })
  }

  const isKnownAccount = (address: string) => {
    return props.accounts.some(a => a.address === address)
  }

  const getAccountName = (address: string) => {
    const known = props.accounts.find(a => a.address === address)
    return known?.meta.name
  }

  // Count new discovered accounts (not in wallet)
  const newAccountsCount = () => {
    return discovered().filter(d => !isKnownAccount(d.address)).length
  }

  // Group accounts by relationship type for summary
  const summaryStats = () => {
    const stats = { identities: 0, proxies: 0, total: discovered().length }
    for (const acc of discovered()) {
      const hasIdentityRel = acc.relationships.some(r =>
        r.type === 'sub-identity' || r.type === 'parent-identity'
      )
      const hasProxyRel = acc.relationships.some(r =>
        r.type === 'has-proxy' || r.type === 'proxy-for'
      )
      if (hasIdentityRel) stats.identities++
      if (hasProxyRel) stats.proxies++
    }
    return stats
  }

  return (
    <div class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div class="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Account Discovery
          </h3>
          <p class="text-xs text-gray-500 mt-1">
            Find related accounts via identity hierarchy and proxy relationships
          </p>
        </div>
        <button
          onClick={scanAccounts}
          disabled={scanning() || props.accounts.length === 0}
          class={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            scanning() || props.accounts.length === 0
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {scanning() ? (
            <span class="flex items-center gap-2">
              <span class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Scanning...
            </span>
          ) : (
            'Scan Accounts'
          )}
        </button>
      </div>

      {/* Error */}
      <Show when={error()}>
        <div class="p-4 bg-red-900/20 border-b border-red-800/50 text-red-400 text-sm">
          {error()}
        </div>
      </Show>

      {/* No accounts warning */}
      <Show when={props.accounts.length === 0}>
        <div class="p-8 text-center text-gray-500">
          Connect a wallet to discover related accounts
        </div>
      </Show>

      {/* Scanning state */}
      <Show when={scanning()}>
        <div class="p-8 text-center">
          <div class="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p class="text-gray-400">Scanning identity and proxy relationships...</p>
          <p class="text-xs text-gray-600 mt-1">This may take a moment</p>
        </div>
      </Show>

      {/* Results */}
      <Show when={!scanning() && discovered().length > 0}>
        {/* Summary */}
        <div class="p-4 bg-gray-800/50 border-b border-gray-800 flex items-center gap-6 text-sm">
          <div>
            <span class="text-gray-500">Total:</span>
            <span class="text-white ml-2">{summaryStats().total} accounts</span>
          </div>
          <div>
            <span class="text-gray-500">New:</span>
            <span class="text-cyan-400 ml-2">{newAccountsCount()}</span>
          </div>
          <Show when={summaryStats().identities > 0}>
            <div>
              <span class="text-gray-500">With identity:</span>
              <span class="text-purple-400 ml-2">{summaryStats().identities}</span>
            </div>
          </Show>
          <Show when={summaryStats().proxies > 0}>
            <div>
              <span class="text-gray-500">With proxy:</span>
              <span class="text-green-400 ml-2">{summaryStats().proxies}</span>
            </div>
          </Show>
        </div>

        {/* Account list */}
        <div class="divide-y divide-gray-800">
          <For each={discovered()}>
            {(account) => (
              <div class="group">
                {/* Account row */}
                <div
                  class={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors ${
                    isKnownAccount(account.address) ? '' : 'border-l-2 border-cyan-500'
                  }`}
                  onClick={() => toggleExpanded(account.address)}
                >
                  <div class="flex items-center gap-3 min-w-0">
                    {/* Expand/collapse */}
                    <Show when={account.relationships.length > 0}>
                      <svg
                        class={`w-4 h-4 text-gray-500 transition-transform ${
                          expanded().has(account.address) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Show>
                    <Show when={account.relationships.length === 0}>
                      <div class="w-4" />
                    </Show>

                    <div class="min-w-0">
                      {/* Name / Identity */}
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-white truncate">
                          {getAccountName(account.address) || account.identityName || 'Unknown'}
                        </span>
                        <Show when={isKnownAccount(account.address)}>
                          <span class="px-1.5 py-0.5 text-xs bg-green-900/50 text-green-400 rounded">
                            Connected
                          </span>
                        </Show>
                        <Show when={account.source === 'discovered' && !isKnownAccount(account.address)}>
                          <span class="px-1.5 py-0.5 text-xs bg-cyan-900/50 text-cyan-400 rounded">
                            Discovered
                          </span>
                        </Show>
                      </div>

                      {/* Address */}
                      <div class="font-mono text-xs text-gray-500 mt-0.5">
                        {formatAddress(account.address)}
                      </div>
                    </div>
                  </div>

                  {/* Relationship badges */}
                  <div class="flex items-center gap-2">
                    <Show when={account.relationships.length > 0}>
                      <span class="text-xs text-gray-500">
                        {account.relationships.length} relationship{account.relationships.length > 1 ? 's' : ''}
                      </span>
                    </Show>

                    {/* Add button for new accounts */}
                    <Show when={!isKnownAccount(account.address) && props.onAddAccount}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          props.onAddAccount?.(account.address, account.identityName || 'Discovered Account')
                        }}
                        class="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        + Add
                      </button>
                    </Show>
                  </div>
                </div>

                {/* Expanded relationships */}
                <Show when={expanded().has(account.address) && account.relationships.length > 0}>
                  <div class="bg-gray-800/30 border-t border-gray-800">
                    <For each={account.relationships}>
                      {(rel) => (
                        <div class="px-4 py-2 flex items-center gap-3 text-sm border-b border-gray-800/50 last:border-0">
                          <span class="w-8 text-center">
                            <span class={`text-lg ${getRelationshipColor(rel.type)}`}>
                              {getRelationshipIcon(rel.type)}
                            </span>
                          </span>
                          <div class="flex-1 min-w-0">
                            <span class={`text-xs ${getRelationshipColor(rel.type)}`}>
                              {getRelationshipLabel(rel.type)}
                            </span>
                            <div class="flex items-center gap-2 mt-0.5">
                              <span class="font-mono text-xs text-gray-400">
                                {formatAddress(rel.relatedAddress)}
                              </span>
                              <Show when={getAccountName(rel.relatedAddress)}>
                                <span class="text-xs text-gray-500">
                                  ({getAccountName(rel.relatedAddress)})
                                </span>
                              </Show>
                            </div>
                            <p class="text-xs text-gray-600 mt-0.5">{rel.details}</p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* No results */}
      <Show when={!scanning() && props.accounts.length > 0 && discovered().length === 0}>
        <div class="p-8 text-center text-gray-500">
          <p>Click "Scan Accounts" to discover related accounts</p>
          <p class="text-xs mt-1">We'll search for identity sub-accounts and proxy relationships</p>
        </div>
      </Show>
    </div>
  )
}
