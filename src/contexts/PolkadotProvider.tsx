import { createContext, useContext, Component, JSX, createSignal, onMount, onCleanup, createEffect } from 'solid-js'
import type { ChainId, ChainConfig, ChainConnection, InjectedAccountWithMeta, AccountInfo, StakingInfo, ProxyDefinition, ProxyType } from '../types/polkadot'

interface PolkadotContextValue {
  // Chain state
  selectedChain: () => ChainId
  setSelectedChain: (chain: ChainId) => void
  connections: () => Record<string, ChainConnection>
  isConnected: (chain?: ChainId) => boolean
  blockNumber: (chain?: ChainId) => string | null

  // Loading states
  isLoading: () => boolean
  error: () => string | null

  // API methods
  connectToChain: (chain: ChainId) => Promise<void>
  getAccountInfo: (address: string, chain?: ChainId) => Promise<AccountInfo | null>
  getStakingInfo: (address: string, chain?: ChainId) => Promise<StakingInfo | null>
  getProxies: (address: string, chain?: ChainId) => Promise<ProxyDefinition[]>
  validateProxyAccess: (proxyAddress: string, delegatorAddresses: string[], chain?: ChainId) => Promise<ProxyDefinition | null>
}

const PolkadotContext = createContext<PolkadotContextValue>()

export const usePolkadot = () => {
  const context = useContext(PolkadotContext)
  if (!context) {
    throw new Error('usePolkadot must be used within PolkadotProvider')
  }
  return context
}

interface PolkadotProviderProps {
  children: JSX.Element
  chains: Record<ChainId, ChainConfig>
  autoConnect?: boolean
}

export const PolkadotProvider: Component<PolkadotProviderProps> = (props) => {
  const [selectedChain, setSelectedChain] = createSignal<ChainId>('polkadot')
  const [connections, setConnections] = createSignal<Record<string, ChainConnection>>({})
  const [blockNumbers, setBlockNumbers] = createSignal<Record<string, string>>({})
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [apiLoaded, setApiLoaded] = createSignal(false)

  let unsubscribers: Record<string, () => void> = {}

  // Dynamic import of Polkadot API
  onMount(async () => {
    try {
      setIsLoading(true)
      const apiModule = await import('https://cdn.jsdelivr.net/npm/@polkadot/api@latest/+esm')
      window.polkadotApi = apiModule
      setApiLoaded(true)

      if (props.autoConnect) {
        await connectToChain('polkadot')
      }
    } catch (err) {
      console.error('Failed to load Polkadot API:', err)
      setError('Failed to load Polkadot libraries')
    } finally {
      setIsLoading(false)
    }
  })

  onCleanup(() => {
    // Unsubscribe from all block subscriptions
    Object.values(unsubscribers).forEach(unsub => unsub())
  })

  const connectToChain = async (chain: ChainId) => {
    if (!apiLoaded()) {
      throw new Error('Polkadot API not loaded')
    }

    const config = props.chains[chain]
    if (!config) {
      throw new Error(`Chain ${chain} not configured`)
    }

    try {
      setIsLoading(true)
      setError(null)

      const { ApiPromise, WsProvider } = window.polkadotApi

      // Connect to relay chain
      const relayProvider = new WsProvider(config.relay)
      const relayApi = await ApiPromise.create({ provider: relayProvider })

      // Check if staking is on Asset Hub
      const metadata = await relayApi.rpc.state.getMetadata()
      const hasStaking = metadata.asLatest.pallets.some((p: any) =>
        p.name.toString() === 'Staking'
      )

      let stakingApi = relayApi
      let assetHubApi = null

      if (!hasStaking && config.assetHub) {
        // Staking migrated to Asset Hub
        const assetHubProvider = new WsProvider(config.assetHub)
        assetHubApi = await ApiPromise.create({ provider: assetHubProvider })
        stakingApi = assetHubApi
      }

      // Subscribe to new blocks
      if (unsubscribers[chain]) {
        unsubscribers[chain]()
      }

      const unsubscribe = await relayApi.rpc.chain.subscribeNewHeads((header: any) => {
        setBlockNumbers(prev => ({
          ...prev,
          [chain]: header.number.toString()
        }))
      })

      unsubscribers[chain] = unsubscribe

      setConnections(prev => ({
        ...prev,
        [chain]: {
          relay: relayApi,
          staking: stakingApi,
          assetHub: assetHubApi
        }
      }))
    } catch (err: any) {
      console.error(`Failed to connect to ${chain}:`, err)
      setError(err.message || `Failed to connect to ${chain}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const isConnected = (chain?: ChainId) => {
    const c = chain || selectedChain()
    return !!connections()[c]
  }

  const blockNumber = (chain?: ChainId) => {
    const c = chain || selectedChain()
    return blockNumbers()[c] || null
  }

  const getAccountInfo = async (address: string, chain?: ChainId): Promise<AccountInfo | null> => {
    const c = chain || selectedChain()
    const conn = connections()[c]

    if (!conn) {
      throw new Error(`Not connected to ${c}`)
    }

    try {
      const account = await conn.relay.query.system.account(address)
      return {
        free: account.data.free.toBigInt(),
        reserved: account.data.reserved.toBigInt(),
        frozen: account.data.frozen?.toBigInt()
      }
    } catch (err) {
      console.error('Failed to get account info:', err)
      return null
    }
  }

  const getStakingInfo = async (address: string, chain?: ChainId): Promise<StakingInfo | null> => {
    const c = chain || selectedChain()
    const conn = connections()[c]

    if (!conn) {
      throw new Error(`Not connected to ${c}`)
    }

    try {
      const info: StakingInfo = {
        isStash: false,
        isValidator: false,
        isNominator: false
      }

      // Check if account is a stash
      const bonded = await conn.staking.query.staking.bonded(address)
      if (bonded.isSome) {
        info.isStash = true

        // Get ledger info
        const ledger = await conn.staking.query.staking.ledger(bonded.unwrap())
        if (ledger.isSome) {
          const ledgerData = ledger.unwrap()
          info.bonded = ledgerData.active.toBigInt()

          if (ledgerData.unlocking) {
            info.unlocking = ledgerData.unlocking.map((unlock: any) => ({
              value: unlock.value.toBigInt(),
              era: unlock.era.toNumber()
            }))
          }
        }

        // Check if validating
        const validators = await conn.staking.query.staking.validators(address)
        if (validators && !validators.isEmpty) {
          info.isValidator = true
        }

        // Check if nominating
        const nominators = await conn.staking.query.staking.nominators(address)
        if (nominators.isSome) {
          info.isNominator = true
        }
      }

      return info
    } catch (err) {
      console.error('Failed to get staking info:', err)
      return null
    }
  }

  const getProxies = async (address: string, chain?: ChainId): Promise<ProxyDefinition[]> => {
    const c = chain || selectedChain()
    const conn = connections()[c]

    if (!conn) {
      throw new Error(`Not connected to ${c}`)
    }

    try {
      // Query proxies for the given address
      const proxiesData = await conn.relay.query.proxy.proxies(address)
      const [proxies] = proxiesData

      return proxies.map((proxy: any) => ({
        delegate: proxy.delegate.toString(),
        proxyType: proxy.proxyType.toString() as ProxyType,
        delay: proxy.delay.toNumber()
      }))
    } catch (err) {
      console.error('Failed to get proxies:', err)
      return []
    }
  }

  const validateProxyAccess = async (
    proxyAddress: string,
    delegatorAddresses: string[],
    chain?: ChainId
  ): Promise<ProxyDefinition | null> => {
    const c = chain || selectedChain()
    const conn = connections()[c]

    if (!conn) {
      throw new Error(`Not connected to ${c}`)
    }

    try {
      // Check each delegator address for proxy relationships
      for (const delegator of delegatorAddresses) {
        const proxiesData = await conn.relay.query.proxy.proxies(delegator)
        const [proxies] = proxiesData

        // Find if proxyAddress is in the list of delegates
        const proxyDef = proxies.find((proxy: any) =>
          proxy.delegate.toString() === proxyAddress
        )

        if (proxyDef) {
          return {
            delegate: proxyDef.delegate.toString(),
            proxyType: proxyDef.proxyType.toString() as ProxyType,
            delay: proxyDef.delay.toNumber()
          }
        }
      }

      return null
    } catch (err) {
      console.error('Failed to validate proxy access:', err)
      return null
    }
  }

  const value: PolkadotContextValue = {
    selectedChain,
    setSelectedChain,
    connections,
    isConnected,
    blockNumber,
    isLoading,
    error,
    connectToChain,
    getAccountInfo,
    getStakingInfo,
    getProxies,
    validateProxyAccess
  }

  return (
    <PolkadotContext.Provider value={value}>
      {props.children}
    </PolkadotContext.Provider>
  )
}

// Declare global window property
declare global {
  interface Window {
    polkadotApi: any
  }
}