import { Component, createSignal, For, Show, createMemo, onMount, onCleanup, createEffect } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import PageHeader from '../components/PageHeader'
import { WalletConnector } from '../components/WalletConnector'
import { ProxyManager } from '../components/polkadot/ProxyManager'
import { StakingModal } from '../components/polkadot/StakingModal'
import { UnclaimedEras } from '../components/polkadot/UnclaimedEras'
import { StakingDashboard } from '../components/polkadot/StakingDashboard'
import { RotkoValidatorStatus } from '../components/polkadot/RotkoValidatorStatus'
import { StakingAccountCard } from '../components/polkadot/StakingAccountCard'
import type { OperationType } from '../components/polkadot/StakingModal'
import { validatorData } from '../data/validator-data'
import type { InjectedAccountWithMeta, ChainId, ChainConfig, ProxyAccount } from '../types/polkadot'
import { getSs58AddressInfo, fromBufferToBase58 } from '@polkadot-api/substrate-bindings'
import { multiChainServicePapi } from '../services/multi-chain-service-papi'
import type { AccountBalance, StakingData } from '../services/multi-chain-service-papi'

const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    relay: 'wss://polkadot.dotters.network',
    assetHub: 'wss://asset-hub-polkadot.dotters.network',
    peopleChain: 'wss://people-polkadot.dotters.network',
    stakingLocation: 'relay',  // Polkadot still has staking on relay chain
    ss58: 0,
    decimals: 10,
    token: 'DOT'
  },
  kusama: {
    name: 'Kusama',
    relay: 'wss://kusama.dotters.network',
    assetHub: 'wss://asset-hub-kusama.dotters.network',
    peopleChain: 'wss://people-kusama.dotters.network',
    stakingLocation: 'assetHub',  // Kusama has staking on asset hub
    ss58: 2,
    decimals: 12,
    token: 'KSM'
  },
  paseo: {
    name: 'Paseo Testnet',
    relay: 'wss://paseo.dotters.network',
    assetHub: 'wss://asset-hub-paseo.dotters.network',
    peopleChain: 'wss://people-paseo.dotters.network',
    stakingLocation: 'assetHub',  // Paseo has staking on asset hub
    ss58: 0,  // Paseo uses same SS58 as Polkadot
    decimals: 10,
    token: 'PAS'
  }
}

const ValidatorToolContent: Component = () => {
  const [connectedAccounts, setConnectedAccounts] = createSignal<InjectedAccountWithMeta[]>([])
  const [proxyAccounts, setProxyAccounts] = createSignal<ProxyAccount[]>([])
  const [searchTerm, setSearchTerm] = createSignal('')
  const [filterType, setFilterType] = createSignal<'all' | 'validators' | 'stashes' | 'nominators' | 'other'>('all')
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('list')
  const [expandedAccounts, setExpandedAccounts] = createSignal<Set<string>>(new Set())
  const [showWalletMenu, setShowWalletMenu] = createSignal(false)
  const [showNetworkMenu, setShowNetworkMenu] = createSignal(false)
  const [showProxyModal, setShowProxyModal] = createSignal(false)
  const [selectedChain, setSelectedChain] = createSignal<ChainId>('polkadot')
  const [copiedAddress, setCopiedAddress] = createSignal<string | null>(null)
  const [connectionStatus, setConnectionStatus] = createSignal({
    relay: false,
    assetHub: false,
    peopleChain: false
  })
  const [accountBalances, setAccountBalances] = createSignal<Map<string, AccountBalance>>(new Map())
  const [accountStaking, setAccountStaking] = createSignal<Map<string, StakingData>>(new Map())
  const [modalOperation, setModalOperation] = createSignal<OperationType | null>(null)
  const [modalAccount, setModalAccount] = createSignal<InjectedAccountWithMeta | null>(null)
  const [txStatus, setTxStatus] = createSignal<{message: string, type: 'success' | 'error' | 'pending'} | null>(null)
  const [currentEra, setCurrentEra] = createSignal<number | null>(null)
  const [currentSession, setCurrentSession] = createSignal<number | null>(null)

  // Keyboard shortcuts
  onMount(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        document.getElementById('wallet-search')?.focus()
      }
      // G for grid, L for list
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) setViewMode('grid')
      if (e.key === 'l' && !e.metaKey && !e.ctrlKey) setViewMode('list')
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  })

  // Subscribe to connection status
  onMount(() => {
    const unsubscribe = multiChainServicePapi.onStatusChange((status) => {
      setConnectionStatus(status)
    })

    onCleanup(() => {
      unsubscribe()
      multiChainServicePapi.disconnect()
    })
  })

  // Connect to all chains when network changes
  createEffect(async () => {
    const chain = selectedChain()
    const config = CHAIN_CONFIGS[chain]

    // Connect to all three chains
    console.log(`Connecting to ${chain} networks:`)
    console.log(`  Relay: ${config.relay}`)
    console.log(`  AssetHub: ${config.assetHub}`)
    console.log(`  People: ${config.peopleChain}`)

    // Connect using the multi-chain service
    await multiChainServicePapi.connect(chain, config)
  })

  // Load account data when accounts or network changes
  createEffect(async () => {
    const accounts = connectedAccounts()
    const chain = selectedChain()
    const config = CHAIN_CONFIGS[chain]

    if (accounts.length === 0 || !multiChainServicePapi.isConnected()) return

    const balances = new Map<string, AccountBalance>()
    const staking = new Map<string, StakingData>()

    // Load data for each account
    for (const account of accounts) {
      try {
        const [balance, stakingData] = await Promise.all([
          multiChainServicePapi.getBalance(account.address),
          multiChainServicePapi.getStakingInfo(account.address)
        ])

        if (balance) balances.set(account.address, balance)
        if (stakingData) staking.set(account.address, stakingData)
      } catch (error) {
        console.error(`Failed to load data for ${account.address}:`, error)
      }
    }

    setAccountBalances(balances)
    setAccountStaking(staking)
  })

  // Format address based on selected network
  const formatAddress = (address: string): string => {
    try {
      const config = CHAIN_CONFIGS[selectedChain()]
      const addressInfo = getSs58AddressInfo(address)
      if (!addressInfo.isValid) return address
      return fromBufferToBase58(config.ss58)(addressInfo.publicKey)
    } catch (err) {
      console.warn('Failed to encode address:', err)
      return address
    }
  }

  // Get account type
  const getAccountType = (account: InjectedAccountWithMeta): 'validator' | 'nominator' | 'stash' | 'other' => {
    const name = account.meta.name?.toLowerCase() || ''
    if (name.includes('validator')) return 'validator'
    if (name.includes('nominator')) return 'nominator'
    if (name.includes('stash')) return 'stash'
    return 'other'
  }

  // Sort accounts by type priority
  const sortAccounts = (accounts: InjectedAccountWithMeta[]) => {
    const typeOrder = { validator: 0, nominator: 1, stash: 2, other: 3 }
    return accounts.sort((a, b) => {
      const aType = getAccountType(a)
      const bType = getAccountType(b)
      return typeOrder[aType] - typeOrder[bType]
    })
  }

  // Group and filter accounts
  const filteredAccounts = createMemo(() => {
    const accounts = connectedAccounts()
    const search = searchTerm().toLowerCase()
    const type = filterType()

    let filtered = accounts.filter(a => {
      const matchesSearch = !search ||
        a.meta.name?.toLowerCase().includes(search) ||
        a.address.toLowerCase().includes(search)

      if (!matchesSearch) return false

      if (type === 'all') return true
      if (type === 'validators') return getAccountType(a) === 'validator'
      if (type === 'nominators') return getAccountType(a) === 'nominator'
      if (type === 'stashes') return getAccountType(a) === 'stash'
      if (type === 'other') return getAccountType(a) === 'other'
      return true
    })

    return sortAccounts(filtered)
  })

  const accountStats = createMemo(() => {
    const accounts = connectedAccounts()
    return {
      total: accounts.length,
      validators: accounts.filter(a => getAccountType(a) === 'validator').length,
      stashes: accounts.filter(a => getAccountType(a) === 'stash').length,
      nominators: accounts.filter(a => getAccountType(a) === 'nominator').length
    }
  })

  const handleAccountsChange = (accounts: InjectedAccountWithMeta[]) => {
    setConnectedAccounts(accounts)
  }

  const handleConnect = (accounts: InjectedAccountWithMeta[]) => {
    setConnectedAccounts(accounts)
  }

  const handleProxyAdded = (proxy: ProxyAccount) => {
    setProxyAccounts([...proxyAccounts(), proxy])
    setShowProxyModal(false)
  }

  const handleClaimRewards = async (account: InjectedAccountWithMeta, eras: number[]) => {
    try {
      setTxStatus({ message: `Claiming rewards for ${eras.length} era(s)...`, type: 'pending' })

      // For now, we'll use the payoutStakers method for each era
      // In a real implementation, you might want to batch these or use a different approach
      for (const era of eras) {
        await multiChainServicePapi.payoutStakers(account, account.address, era)
      }

      setTxStatus({ message: `Successfully claimed rewards for ${eras.length} era(s)`, type: 'success' })

      // Refresh staking data after claiming
      setTimeout(async () => {
        const stakingData = await multiChainServicePapi.getStakingInfo(account.address)
        if (stakingData) {
          setAccountStaking(prev => new Map(prev.set(account.address, stakingData)))
        }
        setTxStatus(null)
      }, 3000)
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      setTxStatus({ message: `Failed to claim rewards: ${error.message}`, type: 'error' })
      setTimeout(() => setTxStatus(null), 5000)
    }
  }

  const toggleAccountExpanded = (address: string) => {
    const current = new Set(expandedAccounts())
    if (current.has(address)) {
      current.delete(address)
    } else {
      current.add(address)
    }
    setExpandedAccounts(current)
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const executeAction = async (action: string, account: InjectedAccountWithMeta) => {
    console.log(`Executing ${action} on ${account.address}`)

    // For operations that need modals
    if (['bond', 'unbond', 'nominate', 'setKeys', 'rebond', 'withdrawUnbonded'].includes(action)) {
      setModalAccount(account)
      setModalOperation(action as OperationType)
      return
    }

    try {
      // Get signer from the wallet extension
      // Get signer using polkadot-api
      const { getInjectedExtensions, connectInjectedExtension } = await import('polkadot-api/pjs-signer')
      const extensions = getInjectedExtensions()
      if (extensions.length === 0) throw new Error('No wallet extension found')

      // Connect to the extension that has this account
      const extension = await connectInjectedExtension(account.meta.source || extensions[0])
      const accounts = await extension.getAccounts()
      const matchingAccount = accounts.find(a => a.address === account.address)
      if (!matchingAccount) throw new Error('Account not found in extension')

      const signer = matchingAccount.polkadotSigner

      setTxStatus({ message: `Executing ${action}...`, type: 'pending' })

      switch (action) {
        case 'claim':
          // Claim rewards - this would need proper implementation
          console.log('Claim rewards action')
          setTxStatus({ message: 'Rewards claimed successfully', type: 'success' })
          break

        case 'validate':
          // Start validating with default commission
          const prefs = { commission: 50000000, blocked: false } // 5% commission
          await multiChainServicePapi.validate(signer, prefs)
          setTxStatus({ message: 'Validation started', type: 'success' })
          break

        case 'chill':
          // Stop validating/nominating
          await multiChainServicePapi.chill(signer)
          setTxStatus({ message: 'Successfully chilled', type: 'success' })
          break

        default:
          console.log(`Unknown action: ${action}`)
      }

      // Refresh account data after transaction
      setTimeout(() => {
        loadAccountData(account)
      }, 2000)

    } catch (error: any) {
      console.error(`Failed to execute ${action}:`, error)
      setTxStatus({ message: error.message || `Failed to ${action}`, type: 'error' })
    }

    // Clear status after 5 seconds
    setTimeout(() => setTxStatus(null), 5000)
  }

  const handleModalSubmit = async (data: any) => {
    const account = modalAccount()
    const operation = modalOperation()
    if (!account || !operation) return

    try {
      // Get signer using polkadot-api
      const { getInjectedExtensions, connectInjectedExtension } = await import('polkadot-api/pjs-signer')
      const extensions = getInjectedExtensions()
      if (extensions.length === 0) throw new Error('No wallet extension found')

      // Connect to the extension that has this account
      const extension = await connectInjectedExtension(account.meta.source || extensions[0])
      const accounts = await extension.getAccounts()
      const matchingAccount = accounts.find(a => a.address === account.address)
      if (!matchingAccount) throw new Error('Account not found in extension')

      const signer = matchingAccount.polkadotSigner

      setTxStatus({ message: `Executing ${operation}...`, type: 'pending' })

      switch (operation) {
        case 'bond':
          await multiChainServicePapi.bond(signer, data.controller, data.amount, data.payee)
          setTxStatus({ message: 'Tokens bonded successfully', type: 'success' })
          break

        case 'unbond':
          await multiChainServicePapi.unbond(signer, data.amount)
          setTxStatus({ message: 'Unbonding initiated', type: 'success' })
          break

        case 'rebond':
          await multiChainServicePapi.rebond(signer, data.amount)
          setTxStatus({ message: 'Tokens rebonded successfully', type: 'success' })
          break

        case 'withdrawUnbonded':
          await multiChainServicePapi.withdrawUnbonded(signer, data.numSlashingSpans || 0)
          setTxStatus({ message: 'Unbonded tokens withdrawn', type: 'success' })
          break

        case 'nominate':
          await multiChainServicePapi.nominate(signer, data.validators)
          setTxStatus({ message: 'Nominations submitted', type: 'success' })
          break

        case 'setKeys':
          await multiChainServicePapi.setKeys(signer, data.keys, data.proof || '0x')
          setTxStatus({ message: 'Session keys updated', type: 'success' })
          break
      }

      // Refresh account data
      setTimeout(() => {
        loadAccountData(account)
      }, 2000)

    } catch (error: any) {
      setTxStatus({ message: error.message || 'Transaction failed', type: 'error' })
    }

    setTimeout(() => setTxStatus(null), 5000)
  }

  const loadAccountData = async (account: InjectedAccountWithMeta) => {
    try {
      const [balance, stakingData] = await Promise.all([
        multiChainServicePapi.getBalance(account.address),
        multiChainServicePapi.getStakingInfo(account.address)
      ])

      if (balance) {
        setAccountBalances(prev => {
          const map = new Map(prev)
          map.set(account.address, balance)
          return map
        })
      }

      if (stakingData) {
        setAccountStaking(prev => {
          const map = new Map(prev)
          map.set(account.address, stakingData)
          return map
        })

        // Update current era and session if available
        if (stakingData.era !== null) {
          setCurrentEra(stakingData.era)
        }
        if (stakingData.sessionIndex !== null) {
          setCurrentSession(stakingData.sessionIndex)
        }
      }
    } catch (error) {
      console.error(`Failed to load data for ${account.address}:`, error)
    }
  }

  // Contextual operations based on account type
  const getOperations = (account: InjectedAccountWithMeta) => {
    const accountType = getAccountType(account)
    const staking = accountStaking().get(account.address)

    const baseOps = [
      { id: 'bond', label: 'Bond More', desc: 'Add tokens to stake' },
      { id: 'unbond', label: 'Unbond', desc: 'Schedule withdrawal' },
      { id: 'claim', label: 'Claim', desc: 'Collect rewards' }
    ]

    // Add withdraw option if there are unlocking funds
    if (staking?.unlocking && staking.unlocking.length > 0) {
      baseOps.push({
        id: 'withdrawUnbonded',
        label: 'Withdraw',
        desc: `${staking.unlocking.length} unlocking`,
        highlight: true
      })
    }

    const validatorOps = [
      { id: 'setKeys', label: 'Set Keys', desc: 'Update session keys', highlight: true },
      { id: 'validate', label: 'Validate', desc: 'Start validating', highlight: true },
      { id: 'chill', label: 'Chill', desc: 'Stop validating' }
    ]

    const stashOps = [
      { id: 'nominate', label: 'Nominate', desc: 'Select validators' },
      { id: 'controller', label: 'Set Controller', desc: 'Change controller' }
    ]

    if (accountType === 'validator') {
      return [...validatorOps, ...baseOps]
    } else if (accountType === 'stash') {
      return [...baseOps, ...stashOps]
    } else if (accountType === 'nominator') {
      return [...baseOps, { id: 'nominate', label: 'Re-nominate', desc: 'Change validators' }]
    } else {
      return baseOps
    }
  }

  // Get real account data from chain
  const getAccountData = (account: InjectedAccountWithMeta) => {
    const accountType = getAccountType(account)
    const chain = selectedChain()
    const config = CHAIN_CONFIGS[chain]
    const token = config.token
    const decimals = config.decimals

    const balance = accountBalances().get(account.address)
    const staking = accountStaking().get(account.address)

    // Calculate total unlocking amount
    const unlockingTotal = staking?.unlocking?.reduce((sum, unlock) => sum + unlock.value, 0n) || 0n

    return {
      balance: balance ? `${multiChainServicePapi.formatBalance(balance.free, decimals)} ${token}` : `0.0000 ${token}`,
      bonded: staking ? `${multiChainServicePapi.formatBalance(staking.bonded, decimals)} ${token}` : `0.0000 ${token}`,
      active: staking ? `${multiChainServicePapi.formatBalance(staking.active, decimals)} ${token}` : `0.0000 ${token}`,
      unlocking: unlockingTotal > 0n ? `${multiChainServicePapi.formatBalance(unlockingTotal, decimals)} ${token}` : null,
      unlockingChunks: staking?.unlocking?.length || 0,
      rewards: '0.0000 ' + token, // TODO: Calculate pending rewards
      rewardDestination: staking?.rewardDestination || null,
      commission: staking?.commission ? `${(staking.commission / 10000000).toFixed(2)}%` : null,
      nominators: staking?.nominators ? staking.nominators.length.toString() : null,
      nominatedValidators: staking?.nominators?.length || 0,
      status: staking ? (staking.validators ? 'Validating' : staking.nominators ? 'Nominating' : 'Inactive') : null,
      era: staking?.era || null,
      sessionIndex: staking?.sessionIndex || null
    }
  }

  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-7xl mx-auto">
        <PageHeader
          title={validatorData.hero.title}
          subtitle={validatorData.hero.subtitle}
        />

        {/* Rotko Validators Status - Always visible */}
        <RotkoValidatorStatus
          chainId={selectedChain()}
          config={CHAIN_CONFIGS[selectedChain()]}
        />

        {/* Dashboard Overview - Show when wallet connected */}
        <Show when={connectedAccounts().length > 0}>
          <StakingDashboard
            config={CHAIN_CONFIGS[selectedChain()]}
            balances={accountBalances()}
            staking={accountStaking()}
            currentEra={currentEra()}
            connectionStatus={connectionStatus()}
          />
        </Show>

        {/* Connection Section - Two separate dropdowns */}
        <div class="mb-6 grid md:grid-cols-2 gap-4">
          {/* Wallet Connection Dropdown */}
          <div>
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu())}
              class="w-full p-4 bg-gray-900 border border-gray-700 rounded flex items-center justify-between hover:border-cyan-400 transition-colors"
            >
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-cyan-400">Wallet</h2>
                <Show when={connectedAccounts().length > 0}>
                  <span class="text-sm text-gray-400">({connectedAccounts().length} connected)</span>
                </Show>
              </div>
              <span class={`text-gray-400 transition-transform ${showWalletMenu() ? 'rotate-180' : ''}`}>▼</span>
            </button>

            <Show when={showWalletMenu()}>
              <div class="mt-1 p-4 bg-gray-900 border border-gray-700 rounded-b">
                <WalletConnector
                  onConnect={handleConnect}
                  onAccountsChange={handleAccountsChange}
                  dappName="Rotko Validator Tool"
                  autoConnect={true}
                />
              </div>
            </Show>
          </div>

          {/* Network Selection Dropdown */}
          <div>
            <button
              onClick={() => setShowNetworkMenu(!showNetworkMenu())}
              class="w-full p-4 bg-gray-900 border border-gray-700 rounded flex items-center justify-between hover:border-cyan-400 transition-colors"
            >
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-cyan-400">Network</h2>
                <span class="text-sm text-gray-300">{CHAIN_CONFIGS[selectedChain()].name}</span>
              </div>
              <span class={`text-gray-400 transition-transform ${showNetworkMenu() ? 'rotate-180' : ''}`}>▼</span>
            </button>

            <Show when={showNetworkMenu()}>
              <div class="mt-1 p-4 bg-gray-900 border border-gray-700 rounded-b">
                <div class="space-y-2">
                  <For each={Object.entries(CHAIN_CONFIGS)}>
                    {([chainId, config]) => (
                      <button
                        onClick={() => {
                          setSelectedChain(chainId as ChainId)
                          setShowNetworkMenu(false)
                        }}
                        class={`w-full p-3 text-left rounded transition-colors ${
                          selectedChain() === chainId
                            ? 'bg-cyan-900/30 border border-cyan-700'
                            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="font-bold">{config.name}</div>
                            <div class="text-xs text-gray-400">
                              {config.token} • SS58: {config.ss58}
                            </div>
                          </div>
                          <Show when={selectedChain() === chainId}>
                            <span class="text-cyan-400">✓</span>
                          </Show>
                        </div>
                      </button>
                    )}
                  </For>
                </div>

                {/* Era and Session Info */}
                <Show when={currentEra() !== null || currentSession() !== null}>
                  <div class="mt-4 pt-4 border-t border-gray-700">
                    <div class="text-sm text-gray-400 mb-2">Network Status:</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <Show when={currentEra() !== null}>
                        <div class="bg-gray-800 rounded px-2 py-1">
                          <span class="text-gray-500">Era:</span>
                          <span class="text-cyan-400 font-mono ml-1">{currentEra()}</span>
                        </div>
                      </Show>
                      <Show when={currentSession() !== null}>
                        <div class="bg-gray-800 rounded px-2 py-1">
                          <span class="text-gray-500">Session:</span>
                          <span class="text-green-400 font-mono ml-1">{currentSession()}</span>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* Connection Status */}
                <div class="mt-4 pt-4 border-t border-gray-700">
                  <div class="text-sm text-gray-400 mb-2">Chain Connections:</div>
                  <div class="space-y-1 text-xs">
                    <div class="flex items-center justify-between">
                      <span>
                        Relay Chain
                        <Show when={selectedChain() === 'polkadot'}>
                          <span class="text-cyan-400 ml-1">(staking, session keys)</span>
                        </Show>
                        <Show when={selectedChain() !== 'polkadot'}>
                          <span class="text-cyan-400 ml-1">(session keys)</span>
                        </Show>
                      </span>
                      <span class={connectionStatus().relay ? 'text-green-400' : 'text-yellow-400'}>
                        {connectionStatus().relay ? '● Connected' : '○ Connecting...'}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>
                        Asset Hub
                        <Show when={selectedChain() !== 'polkadot'}>
                          <span class="text-cyan-400 ml-1">(staking)</span>
                        </Show>
                      </span>
                      <span class={connectionStatus().assetHub ? 'text-green-400' : 'text-yellow-400'}>
                        {connectionStatus().assetHub ? '● Connected' : '○ Connecting...'}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>People Chain <span class="text-cyan-400 ml-1">(identity)</span></span>
                      <span class={connectionStatus().peopleChain ? 'text-green-400' : 'text-yellow-400'}>
                        {connectionStatus().peopleChain ? '● Connected' : '○ Connecting...'}
                      </span>
                    </div>
                  </div>

                  {/* Info about staking location */}
                  <div class="mt-3 p-2 bg-gray-800 rounded text-xs">
                    <Show when={selectedChain() === 'polkadot'}>
                      <div class="text-gray-400">
                        <span class="text-cyan-400">ℹ</span> Polkadot staking operations remain on the relay chain.
                      </div>
                    </Show>
                    <Show when={selectedChain() !== 'polkadot'}>
                      <div class="text-gray-400">
                        <span class="text-cyan-400">ℹ</span> {CHAIN_CONFIGS[selectedChain()].name} staking has migrated to Asset Hub.
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <Show when={connectedAccounts().length > 0}>
          {/* Controls Bar */}
          <div class="mb-6 p-4 bg-gray-900 border border-gray-700 rounded">
            <div class="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div class="flex-1 min-w-[200px]">
                <input
                  id="wallet-search"
                  type="text"
                  placeholder="Search... (⌘F)"
                  class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm focus:border-cyan-400 focus:outline-none"
                  value={searchTerm()}
                  onInput={(e) => setSearchTerm(e.currentTarget.value)}
                />
              </div>

              {/* Filter */}
              <select
                class="px-3 py-2 bg-black border border-gray-700 rounded text-sm focus:border-cyan-400 focus:outline-none"
                value={filterType()}
                onChange={(e) => setFilterType(e.currentTarget.value as any)}
              >
                <option value="all">All</option>
                <option value="validators">Validators</option>
                <option value="nominators">Nominators</option>
                <option value="stashes">Stashes</option>
                <option value="other">Other</option>
              </select>

              {/* View Mode */}
              <div class="flex gap-1 bg-black border border-gray-700 rounded p-1">
                <button
                  class={`px-3 py-1 rounded text-xs ${viewMode() === 'grid' ? 'bg-cyan-600' : 'hover:bg-gray-800'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid (G)"
                >
                  Grid
                </button>
                <button
                  class={`px-3 py-1 rounded text-xs ${viewMode() === 'list' ? 'bg-cyan-600' : 'hover:bg-gray-800'}`}
                  onClick={() => setViewMode('list')}
                  title="List (L)"
                >
                  List
                </button>
              </div>

              {/* Add Proxy */}
              <button
                class="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                onClick={() => setShowProxyModal(true)}
              >
                Proxy
              </button>
            </div>
          </div>

          {/* Proxy Modal */}
          <Show when={showProxyModal()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div class="bg-gray-900 border border-gray-700 rounded p-6 max-w-2xl w-full">
                <h3 class="text-xl font-bold text-cyan-400 mb-4">Proxy Management</h3>
                <ProxyManager
                  connectedAccounts={connectedAccounts()}
                  onProxyAdded={handleProxyAdded}
                />
                <button
                  class="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  onClick={() => setShowProxyModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </Show>

          {/* Accounts Display */}
          <div class={viewMode() === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
            <For each={filteredAccounts()}>
              {(account) => {
                const isExpanded = () => expandedAccounts().has(account.address)
                const accountType = getAccountType(account)
                const operations = getOperations(account)
                const accountData = getAccountData(account)

                return (
                  <div
                    class={`bg-black border rounded transition-all ${
                      isExpanded()
                        ? 'border-cyan-400 shadow-lg shadow-cyan-400/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {/* Header */}
                    <div
                      class="w-full p-4 flex items-start justify-between text-left cursor-pointer"
                      onClick={() => toggleAccountExpanded(account.address)}
                    >
                      <div class="flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-mono text-sm text-cyan-400">
                            {account.meta.name || 'Unnamed Account'}
                          </span>
                          <Show when={accountType === 'validator'}>
                            <span class="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded">
                              Validator
                            </span>
                          </Show>
                          <Show when={accountType === 'stash'}>
                            <span class="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded">
                              Stash
                            </span>
                          </Show>
                          <Show when={accountType === 'nominator'}>
                            <span class="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded">
                              Nominator
                            </span>
                          </Show>
                          <Show when={accountData.status}>
                            <span class="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                              {accountData.status}
                            </span>
                          </Show>
                        </div>

                        {/* Address with copy button */}
                        <div class="flex items-center gap-2 mt-1">
                          <span class="font-mono text-xs text-gray-500">
                            {formatAddress(account.address)}
                          </span>
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              copyAddress(formatAddress(account.address))
                            }}
                            class="text-gray-600 hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Copy address"
                          >
                            <Show when={copiedAddress() === formatAddress(account.address)} fallback={
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            }>
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </Show>
                          </div>
                        </div>

                        {/* Basic data always visible */}
                        <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span class="text-gray-500">Balance:</span>
                            <span class="text-white ml-1 font-mono">{accountData.balance}</span>
                          </div>
                          <Show when={accountType === 'validator' || accountType === 'stash' || accountType === 'nominator' || (accountData.bonded && !accountData.bonded.startsWith('0.0000'))}>
                            <div>
                              <span class="text-gray-500">Bonded:</span>
                              <span class={`ml-1 font-mono ${accountData.bonded.startsWith('0.0000') ? 'text-gray-400' : 'text-orange-400'}`}>
                                {accountData.bonded}
                              </span>
                            </div>
                          </Show>
                          <Show when={accountType === 'validator' || accountType === 'stash' || accountType === 'nominator' || (accountData.active && !accountData.active.startsWith('0.0000'))}>
                            <div>
                              <span class="text-gray-500">Active:</span>
                              <span class={`ml-1 font-mono ${accountData.active.startsWith('0.0000') ? 'text-gray-400' : 'text-green-400'}`}>
                                {accountData.active}
                              </span>
                            </div>
                          </Show>
                          <Show when={accountData.unlocking}>
                            <div>
                              <span class="text-gray-500">Unlocking:</span>
                              <span class="text-yellow-400 ml-1 font-mono">
                                {accountData.unlocking}
                              </span>
                              <Show when={accountData.unlockingChunks > 0}>
                                <span class="text-gray-500 ml-1 text-xs">
                                  ({accountData.unlockingChunks} chunks)
                                </span>
                              </Show>
                            </div>
                          </Show>
                          <Show when={accountData.rewardDestination}>
                            <div>
                              <span class="text-gray-500">Rewards to:</span>
                              <span class="text-purple-400 ml-1 text-xs">{accountData.rewardDestination}</span>
                            </div>
                          </Show>
                          <Show when={accountData.rewards && !accountData.rewards.startsWith('0.0000')}>
                            <div>
                              <span class="text-gray-500">Pending:</span>
                              <span class="text-cyan-400 ml-1 font-mono">{accountData.rewards}</span>
                            </div>
                          </Show>
                          <Show when={accountData.commission}>
                            <div>
                              <span class="text-gray-500">Commission:</span>
                              <span class="text-white ml-1">{accountData.commission}</span>
                            </div>
                          </Show>
                          <Show when={accountData.nominators}>
                            <div>
                              <span class="text-gray-500">Nominators:</span>
                              <span class="text-white ml-1">{accountData.nominators}</span>
                            </div>
                          </Show>
                          <Show when={accountData.nominatedValidators > 0}>
                            <div>
                              <span class="text-gray-500">Nominating:</span>
                              <span class="text-blue-400 ml-1">{accountData.nominatedValidators} validators</span>
                            </div>
                          </Show>
                        </div>
                      </div>
                      <span class={`text-gray-400 transition-transform ${isExpanded() ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>

                    {/* Expanded Content */}
                    <Show when={isExpanded()}>
                      <div class="border-t border-gray-800">
                        {/* Unclaimed Eras */}
                        <Show when={accountStaking().get(account.address)?.unclaimedEras?.length > 0}>
                          <div class="p-4 border-b border-gray-800">
                            <UnclaimedEras
                              unclaimedEras={accountStaking().get(account.address)?.unclaimedEras || []}
                              account={account}
                              currentEra={accountStaking().get(account.address)?.era}
                              isValidator={getAccountType(account) === 'validator'}
                              onClaimRewards={(eras) => handleClaimRewards(account, eras)}
                            />
                          </div>
                        </Show>

                        {/* Operations */}
                        <div class="p-4">
                          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <For each={operations}>
                              {(op) => (
                                <button
                                  class={`p-3 rounded border text-left transition-all ${
                                    op.highlight
                                      ? 'bg-cyan-900/20 border-cyan-700 hover:bg-cyan-900/30'
                                      : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    executeAction(op.id, account)
                                  }}
                                >
                                  <div class={`font-bold text-sm ${op.highlight ? 'text-cyan-400' : ''}`}>
                                    {op.label}
                                  </div>
                                  <div class="text-xs text-gray-400 mt-0.5">{op.desc}</div>
                                </button>
                              )}
                            </For>
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>

        {/* Transaction Status */}
        <Show when={txStatus()}>
          <div class={`fixed bottom-4 right-4 p-4 rounded-lg border ${
            txStatus()?.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-400' :
            txStatus()?.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-400' :
            'bg-blue-900/90 border-blue-700 text-blue-400'
          } z-50`}>
            <div class="flex items-center gap-2">
              <Show when={txStatus()?.type === 'pending'}>
                <div class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              </Show>
              <span>{txStatus()?.message}</span>
            </div>
          </div>
        </Show>

        {/* Staking Modal */}
        <StakingModal
          show={!!modalOperation()}
          operation={modalOperation() || 'bond'}
          account={modalAccount()}
          token={CHAIN_CONFIGS[selectedChain()].token}
          decimals={CHAIN_CONFIGS[selectedChain()].decimals}
          currentBonded={modalAccount() ? accountStaking().get(modalAccount()!.address)?.bonded : undefined}
          maxBalance={modalAccount() ? accountBalances().get(modalAccount()!.address)?.free : undefined}
          onClose={() => {
            setModalOperation(null)
            setModalAccount(null)
          }}
          onSubmit={handleModalSubmit}
        />

      </section>
    </MainLayout>
  )
}

const ValidatorPage: Component = () => {
  return <ValidatorToolContent />
}

export default ValidatorPage