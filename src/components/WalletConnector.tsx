import { Component, createSignal, onMount, createEffect, For, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { InjectedAccountWithMeta, InjectedExtension } from '../types/polkadot'

interface WalletConnectorProps {
  onConnect?: (accounts: InjectedAccountWithMeta[], extension: string) => void
  onDisconnect?: () => void
  onAccountsChange?: (accounts: InjectedAccountWithMeta[]) => void
  autoConnect?: boolean
  dappName?: string
}

interface WalletInfo {
  name: string
  installed: boolean
  version?: string
  website?: string
}

const WALLET_EXTENSIONS = {
  'polkadot-js': {
    name: 'Polkadot.js',
    website: 'https://polkadot.js.org/extension/'
  },
  talisman: {
    name: 'Talisman',
    website: 'https://talisman.xyz/'
  },
  subwallet: {
    name: 'SubWallet',
    website: 'https://subwallet.app/'
  }
}

export const WalletConnector: Component<WalletConnectorProps> = (props) => {
  const [wallets, setWallets] = createStore<Record<string, WalletInfo>>({})
  const [isConnected, setIsConnected] = createSignal(false)
  const [isConnecting, setIsConnecting] = createSignal(false)
  const [connectedExtension, setConnectedExtension] = createSignal<string | null>(null)
  const [accounts, setAccounts] = createSignal<InjectedAccountWithMeta[]>([])
  const [error, setError] = createSignal<string | null>(null)

  let unsubscribe: (() => void) | null = null

  onMount(async () => {
    await detectWallets()

    if (props.autoConnect && Object.keys(wallets).length > 0) {
      // Try to connect to the first available wallet
      const firstWallet = Object.keys(wallets).find(w => wallets[w].installed)
      if (firstWallet) {
        await connectWallet(firstWallet)
      }
    }
  })

  const detectWallets = async () => {
    // Wait for extensions to inject
    await new Promise(resolve => setTimeout(resolve, 300))

    const detectedWallets: Record<string, WalletInfo> = {}

    // Import polkadot-api to check for extensions
    try {
      const { getInjectedExtensions } = await import('polkadot-api/pjs-signer')
      const installedExtensions = getInjectedExtensions()

      // Mark installed extensions
      installedExtensions.forEach(key => {
        detectedWallets[key] = {
          name: WALLET_EXTENSIONS[key as keyof typeof WALLET_EXTENSIONS]?.name || key,
          installed: true,
          version: undefined, // polkadot-api doesn't provide version info
          website: WALLET_EXTENSIONS[key as keyof typeof WALLET_EXTENSIONS]?.website
        }
      })
    } catch (err) {
      console.warn('Failed to detect wallets:', err)
    }

    // Add non-installed wallets for reference
    Object.entries(WALLET_EXTENSIONS).forEach(([key, info]) => {
      if (!detectedWallets[key]) {
        detectedWallets[key] = {
          name: info.name,
          installed: false,
          website: info.website
        }
      }
    })

    setWallets(detectedWallets)
  }

  const connectWallet = async (extensionName: string) => {
    if (!window.injectedWeb3?.[extensionName]) {
      setError(`Extension ${extensionName} not found`)
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Import polkadot-api signer utilities
      const { getInjectedExtensions, connectInjectedExtension } = await import('polkadot-api/pjs-signer')

      // Check if the extension exists
      const availableExtensions = getInjectedExtensions()
      if (!availableExtensions.includes(extensionName)) {
        throw new Error(`Extension ${extensionName} not found`)
      }

      // Connect to the extension
      const extension = await connectInjectedExtension(extensionName)

      // Get accounts from the extension
      const extensionAccounts = await extension.getAccounts()

      // Convert to InjectedAccountWithMeta format for compatibility
      const formattedAccounts = extensionAccounts.map(account => ({
        address: account.address,
        meta: {
          genesisHash: account.genesisHash,
          name: account.name,
          source: extensionName
        },
        type: account.type || 'ed25519'
      }))

      setAccounts(formattedAccounts)
      setIsConnected(true)
      setConnectedExtension(extensionName)

      // Subscribe to account changes
      try {
        const unsubscribeFn = extension.subscribe((updatedAccounts) => {
          const formatted = updatedAccounts.map(account => ({
            address: account.address,
            meta: {
              genesisHash: account.genesisHash,
              name: account.name,
              source: extensionName
            },
            type: account.type || 'ed25519'
          }))
          setAccounts(formatted)
          props.onAccountsChange?.(formatted)
        })
        unsubscribe = unsubscribeFn
      } catch (subErr) {
        console.warn('Account subscription not supported by this extension:', subErr)
        // Connection still works even if subscription fails
      }

      props.onConnect?.(formattedAccounts, extensionName)
    } catch (err: any) {
      console.error('Failed to connect wallet:', err)
      // Filter out DOM-related errors that don't affect functionality
      if (!err.message?.includes('firstChild')) {
        setError(err.message || 'Failed to connect wallet')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    setAccounts([])
    setIsConnected(false)
    setConnectedExtension(null)
    props.onDisconnect?.()
  }

  // Auto-reconnect on refresh if previously connected
  createEffect(() => {
    const savedExtension = localStorage.getItem('rotko_wallet_extension')
    if (savedExtension && wallets[savedExtension]?.installed && !isConnected()) {
      connectWallet(savedExtension)
    }
  })

  // Save connected extension
  createEffect(() => {
    const ext = connectedExtension()
    if (ext) {
      localStorage.setItem('rotko_wallet_extension', ext)
    } else {
      localStorage.removeItem('rotko_wallet_extension')
    }
  })

  return (
    <div class="border border-gray-700 bg-gray-900 p-6 rounded">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-cyan-400">Wallet Connection</h3>
        <Show when={isConnected()}>
          <button
            onClick={disconnectWallet}
            class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Disconnect
          </button>
        </Show>
      </div>

      <Show when={error()}>
        <div class="mb-4 p-3 bg-red-900/20 text-red-400 border border-red-800 rounded text-sm">
          {error()}
        </div>
      </Show>

      <Show
        when={!isConnected()}
        fallback={
          <div>
            <div class="mb-2 text-sm text-gray-400">
              Connected to {connectedExtension()} with {accounts().length} account(s)
            </div>
            <Show when={accounts().length > 0}>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <For each={accounts()}>
                  {(account) => (
                    <div class="p-3 bg-gray-800 rounded">
                      <div class="font-mono text-sm text-cyan-400">
                        {account.meta?.name || 'Unnamed Account'}
                      </div>
                      <div class="font-mono text-xs text-gray-500 mt-1">
                        {account.address?.slice(0, 8)}...{account.address?.slice(-6)}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        }
      >
        <div class="space-y-2">
          <For each={Object.entries(wallets)}>
            {([key, wallet]) => (
              <Show
                when={wallet.installed}
                fallback={
                  <a
                    href={wallet.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-3 bg-gray-800/50 hover:bg-gray-800 rounded text-sm border border-gray-700"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-bold text-gray-400">{wallet.name}</div>
                        <div class="text-xs text-gray-500">Not installed - Click to download</div>
                      </div>
                      <div class="text-gray-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </a>
                }
              >
                <button
                  onClick={() => connectWallet(key)}
                  disabled={isConnecting()}
                  class="w-full p-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-left"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-bold text-cyan-400">{wallet.name}</div>
                      <div class="text-xs text-gray-400">
                        {wallet.version ? `v${wallet.version}` : 'Click to connect'}
                      </div>
                    </div>
                    <Show when={isConnecting() && connectedExtension() === key}>
                      <div class="text-cyan-400">
                        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </Show>
                  </div>
                </button>
              </Show>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}