import { Component, createSignal, Show, createEffect, onMount, onCleanup, For } from 'solid-js'
import { useSearchParams } from '@solidjs/router'
import MainLayout from '../layouts/MainLayout'
import { WalletConnector } from '../components/WalletConnector'
import type { InjectedAccountWithMeta, ChainId, ChainConfig } from '../types/polkadot'
import { multiChainServicePapi } from '../services/multi-chain-service-papi'
import type { AccountBalance, StakingData } from '../services/multi-chain-service-papi'
import { ROTKO_VALIDATORS } from '../data/validator-data'

const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    relay: 'wss://polkadot.dotters.network',
    assetHub: 'wss://asset-hub-polkadot.dotters.network',
    peopleChain: 'wss://people-polkadot.dotters.network',
    stakingLocation: 'assetHub',
    ss58: 0,
    decimals: 10,
    token: 'DOT'
  },
  kusama: {
    name: 'Kusama',
    relay: 'wss://kusama.dotters.network',
    assetHub: 'wss://asset-hub-kusama.dotters.network',
    peopleChain: 'wss://people-kusama.dotters.network',
    stakingLocation: 'assetHub',
    ss58: 2,
    decimals: 12,
    token: 'KSM'
  },
  paseo: {
    name: 'Paseo',
    relay: 'wss://paseo.dotters.network',
    assetHub: 'wss://asset-hub-paseo.dotters.network',
    peopleChain: 'wss://people-paseo.dotters.network',
    stakingLocation: 'assetHub',
    ss58: 0,
    decimals: 10,
    token: 'PAS'
  }
}

type TabId = 'nominate' | 'bond' | 'session' | 'status'

const ValidatorPage: Component = () => {
  const [searchParams] = useSearchParams()

  // Core state
  const [selectedChain, setSelectedChain] = createSignal<ChainId>(
    (searchParams.network?.toLowerCase() as ChainId) || 'polkadot'
  )
  const [connectedAccounts, setConnectedAccounts] = createSignal<InjectedAccountWithMeta[]>([])
  const [selectedAccount, setSelectedAccount] = createSignal<InjectedAccountWithMeta | null>(null)
  const [activeTab, setActiveTab] = createSignal<TabId>('nominate')

  // Chain data
  const [balance, setBalance] = createSignal<AccountBalance | null>(null)
  const [stakingData, setStakingData] = createSignal<StakingData | null>(null)
  const [connectionStatus, setConnectionStatus] = createSignal({ relay: false, assetHub: false, peopleChain: false })

  // Operation state
  const [txStatus, setTxStatus] = createSignal<{ msg: string; type: 'pending' | 'success' | 'error' } | null>(null)
  const [bondAmount, setBondAmount] = createSignal('')
  const [sessionKeys, setSessionKeys] = createSignal('')
  const [selectedValidators, setSelectedValidators] = createSignal<string[]>([])

  // Pre-selected validator from URL
  const preselectedValidator = () => searchParams.nominate as string | undefined

  const config = () => CHAIN_CONFIGS[selectedChain()]
  const rotkoValidators = () => ROTKO_VALIDATORS[selectedChain()] || []

  // Connect to chain on mount/network change
  createEffect(async () => {
    const chain = selectedChain()
    const cfg = CHAIN_CONFIGS[chain]
    await multiChainServicePapi.connect(chain, cfg)
  })

  onMount(() => {
    const unsubscribe = multiChainServicePapi.onStatusChange(setConnectionStatus)

    // Pre-select Rotko validators if coming from staking page
    if (preselectedValidator()) {
      setSelectedValidators([preselectedValidator()!])
    }

    onCleanup(() => {
      unsubscribe()
      multiChainServicePapi.disconnect()
    })
  })

  // Load account data when account selected
  createEffect(async () => {
    const account = selectedAccount()
    if (!account) {
      setBalance(null)
      setStakingData(null)
      return
    }

    const [bal, staking] = await Promise.all([
      multiChainServicePapi.getBalance(account.address),
      multiChainServicePapi.getStakingInfo(account.address)
    ])
    setBalance(bal)
    setStakingData(staking)
  })

  const formatBalance = (value: bigint): string => {
    const cfg = config()
    return multiChainServicePapi.formatBalance(value, cfg.decimals)
  }

  const parseAmount = (input: string): bigint => {
    const cfg = config()
    const parts = input.split('.')
    const whole = BigInt(parts[0] || 0)
    const decimal = (parts[1] || '').padEnd(cfg.decimals, '0').slice(0, cfg.decimals)
    return whole * (10n ** BigInt(cfg.decimals)) + BigInt(decimal)
  }

  // Get signer from wallet extension
  const getSigner = async (account: InjectedAccountWithMeta) => {
    const { getInjectedExtensions, connectInjectedExtension } = await import('polkadot-api/pjs-signer')
    const extensions = getInjectedExtensions()
    if (extensions.length === 0) throw new Error('No wallet extension found')

    const extension = await connectInjectedExtension(account.meta.source || extensions[0])
    const accounts = await extension.getAccounts()
    const match = accounts.find(a => a.address === account.address)
    if (!match) throw new Error('Account not found in extension')

    return match.polkadotSigner
  }

  // Staking operations
  const handleBond = async () => {
    const account = selectedAccount()
    if (!account || !bondAmount()) return

    setTxStatus({ msg: 'Signing transaction...', type: 'pending' })
    try {
      const signer = await getSigner(account)
      const amount = parseAmount(bondAmount())
      await multiChainServicePapi.bond(signer, account.address, amount, 'Staked')
      setTxStatus({ msg: 'Bonded successfully', type: 'success' })
      setBondAmount('')
      // Refresh data
      const staking = await multiChainServicePapi.getStakingInfo(account.address)
      setStakingData(staking)
    } catch (e: any) {
      setTxStatus({ msg: e.message || 'Bond failed', type: 'error' })
    }
  }

  const handleNominate = async () => {
    const account = selectedAccount()
    if (!account || selectedValidators().length === 0) return

    setTxStatus({ msg: 'Signing nomination...', type: 'pending' })
    try {
      const signer = await getSigner(account)
      await multiChainServicePapi.nominate(signer, selectedValidators())
      setTxStatus({ msg: `Nominated ${selectedValidators().length} validator(s)`, type: 'success' })
    } catch (e: any) {
      setTxStatus({ msg: e.message || 'Nomination failed', type: 'error' })
    }
  }

  const handleSetKeys = async () => {
    const account = selectedAccount()
    if (!account || !sessionKeys()) return

    setTxStatus({ msg: 'Setting session keys on relay chain...', type: 'pending' })
    try {
      const signer = await getSigner(account)
      await multiChainServicePapi.setKeys(signer, sessionKeys(), '0x')
      setTxStatus({ msg: 'Session keys set', type: 'success' })
      setSessionKeys('')
    } catch (e: any) {
      setTxStatus({ msg: e.message || 'Set keys failed', type: 'error' })
    }
  }

  const toggleValidator = (address: string) => {
    const current = selectedValidators()
    if (current.includes(address)) {
      setSelectedValidators(current.filter(v => v !== address))
    } else if (current.length < 16) {
      setSelectedValidators([...current, address])
    }
  }

  const selectAllRotko = () => {
    setSelectedValidators(rotkoValidators().map(v => v.address))
  }

  return (
    <MainLayout>
      <div class="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-cyan-400 font-mono">vctl</h1>
          <p class="text-gray-400 text-sm">validator control tool</p>
        </div>

        {/* Network + Wallet Row */}
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          {/* Network Selector */}
          <div class="p-4 bg-gray-900 border border-gray-700">
            <div class="text-xs text-gray-500 mb-2">network</div>
            <div class="flex gap-2">
              <For each={Object.entries(CHAIN_CONFIGS)}>
                {([id, cfg]) => (
                  <button
                    onClick={() => setSelectedChain(id as ChainId)}
                    class={`px-3 py-1 text-sm font-mono ${
                      selectedChain() === id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {cfg.token}
                  </button>
                )}
              </For>
            </div>
            <div class="mt-2 text-xs text-gray-600">
              relay: {connectionStatus().relay ? '●' : '○'} |
              staking: {connectionStatus().assetHub ? '●' : '○'}
            </div>
          </div>

          {/* Wallet */}
          <div class="p-4 bg-gray-900 border border-gray-700">
            <div class="text-xs text-gray-500 mb-2">wallet</div>
            <Show when={connectedAccounts().length === 0}>
              <WalletConnector
                onConnect={setConnectedAccounts}
                onAccountsChange={setConnectedAccounts}
                dappName="vctl"
                autoConnect={true}
              />
            </Show>
            <Show when={connectedAccounts().length > 0}>
              <select
                class="w-full bg-black border border-gray-700 px-2 py-1 text-sm font-mono"
                onChange={(e) => {
                  const addr = e.currentTarget.value
                  const acc = connectedAccounts().find(a => a.address === addr)
                  setSelectedAccount(acc || null)
                }}
              >
                <option value="">select account</option>
                <For each={connectedAccounts()}>
                  {(acc) => (
                    <option value={acc.address}>
                      {acc.meta.name || acc.address.slice(0, 8)}
                    </option>
                  )}
                </For>
              </select>
            </Show>
          </div>
        </div>

        {/* Account Info */}
        <Show when={selectedAccount()}>
          <div class="mb-6 p-4 bg-gray-900 border border-gray-700">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div class="text-gray-500">free</div>
                <div class="font-mono text-cyan-400">
                  {balance() ? formatBalance(balance()!.free) : '—'} {config().token}
                </div>
              </div>
              <div>
                <div class="text-gray-500">bonded</div>
                <div class="font-mono text-orange-400">
                  {stakingData() ? formatBalance(stakingData()!.bonded) : '—'} {config().token}
                </div>
              </div>
              <div>
                <div class="text-gray-500">active</div>
                <div class="font-mono text-green-400">
                  {stakingData() ? formatBalance(stakingData()!.active) : '—'} {config().token}
                </div>
              </div>
              <div>
                <div class="text-gray-500">status</div>
                <div class="font-mono">
                  {stakingData()?.nominators ? 'nominating' : stakingData()?.validators ? 'validating' : 'idle'}
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Tabs */}
        <div class="border-b border-gray-700 mb-6">
          <div class="flex gap-1">
            <button
              onClick={() => setActiveTab('nominate')}
              class={`px-4 py-2 text-sm font-mono border-b-2 ${
                activeTab() === 'nominate' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500'
              }`}
            >
              nominate
            </button>
            <button
              onClick={() => setActiveTab('bond')}
              class={`px-4 py-2 text-sm font-mono border-b-2 ${
                activeTab() === 'bond' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500'
              }`}
            >
              bond
            </button>
            <button
              onClick={() => setActiveTab('session')}
              class={`px-4 py-2 text-sm font-mono border-b-2 ${
                activeTab() === 'session' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500'
              }`}
            >
              session keys
            </button>
            <button
              onClick={() => setActiveTab('status')}
              class={`px-4 py-2 text-sm font-mono border-b-2 ${
                activeTab() === 'status' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500'
              }`}
            >
              status
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div class="min-h-[300px]">
          {/* Nominate Tab */}
          <Show when={activeTab() === 'nominate'}>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-400">
                  select validators ({selectedValidators().length}/16)
                </div>
                <button
                  onClick={selectAllRotko}
                  class="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  [select all rotko]
                </button>
              </div>

              {/* Rotko Validators */}
              <div class="space-y-2">
                <For each={rotkoValidators()}>
                  {(v) => (
                    <button
                      onClick={() => toggleValidator(v.address)}
                      class={`w-full p-3 text-left border ${
                        selectedValidators().includes(v.address)
                          ? 'bg-cyan-900/30 border-cyan-600'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-mono text-sm">{v.name}</span>
                        <span class={selectedValidators().includes(v.address) ? 'text-cyan-400' : 'text-gray-600'}>
                          {selectedValidators().includes(v.address) ? '✓' : '○'}
                        </span>
                      </div>
                      <div class="font-mono text-xs text-gray-500 mt-1">
                        {v.address.slice(0, 16)}...{v.address.slice(-8)}
                      </div>
                    </button>
                  )}
                </For>
              </div>

              {/* Custom validator input */}
              <div class="pt-4 border-t border-gray-800">
                <div class="text-xs text-gray-500 mb-2">add custom validator</div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="validator address"
                    class="flex-1 bg-black border border-gray-700 px-3 py-2 text-sm font-mono"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget.value.trim()
                        if (input && !selectedValidators().includes(input)) {
                          setSelectedValidators([...selectedValidators(), input])
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Nominate Button */}
              <button
                onClick={handleNominate}
                disabled={!selectedAccount() || selectedValidators().length === 0}
                class="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 font-mono"
              >
                nominate {selectedValidators().length} validator(s)
              </button>
            </div>
          </Show>

          {/* Bond Tab */}
          <Show when={activeTab() === 'bond'}>
            <div class="space-y-4">
              <div>
                <div class="text-xs text-gray-500 mb-2">amount to bond</div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="0.0"
                    value={bondAmount()}
                    onInput={(e) => setBondAmount(e.currentTarget.value.replace(/[^0-9.]/g, ''))}
                    class="flex-1 bg-black border border-gray-700 px-3 py-2 font-mono"
                  />
                  <span class="px-3 py-2 bg-gray-800 text-gray-400">{config().token}</span>
                </div>
                <Show when={balance()}>
                  <div class="text-xs text-gray-500 mt-1">
                    available: {formatBalance(balance()!.free)} {config().token}
                  </div>
                </Show>
              </div>

              <button
                onClick={handleBond}
                disabled={!selectedAccount() || !bondAmount()}
                class="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 font-mono"
              >
                bond
              </button>

              <Show when={stakingData()?.bonded && stakingData()!.bonded > 0n}>
                <div class="pt-4 border-t border-gray-800">
                  <div class="text-xs text-gray-500 mb-2">currently bonded</div>
                  <div class="font-mono text-orange-400">
                    {formatBalance(stakingData()!.bonded)} {config().token}
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Session Keys Tab */}
          <Show when={activeTab() === 'session'}>
            <div class="space-y-4">
              <div class="p-3 bg-yellow-900/20 border border-yellow-800 text-sm text-yellow-400">
                session keys are set on the relay chain ({config().name})
              </div>

              <div>
                <div class="text-xs text-gray-500 mb-2">generate keys on your node</div>
                <pre class="p-3 bg-black border border-gray-700 text-xs font-mono text-gray-400 overflow-x-auto">
{`curl -H "Content-Type: application/json" \\
  -d '{"id":1,"jsonrpc":"2.0","method":"author_rotateKeys"}' \\
  http://YOUR_VALIDATOR:9944`}
                </pre>
              </div>

              <div>
                <div class="text-xs text-gray-500 mb-2">paste session keys (hex)</div>
                <textarea
                  placeholder="0x..."
                  value={sessionKeys()}
                  onInput={(e) => setSessionKeys(e.currentTarget.value)}
                  rows={3}
                  class="w-full bg-black border border-gray-700 px-3 py-2 font-mono text-sm"
                />
              </div>

              <button
                onClick={handleSetKeys}
                disabled={!selectedAccount() || !sessionKeys()}
                class="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 font-mono"
              >
                set session keys
              </button>
            </div>
          </Show>

          {/* Status Tab */}
          <Show when={activeTab() === 'status'}>
            <div class="space-y-4">
              <Show when={!selectedAccount()}>
                <div class="text-gray-500 text-center py-8">
                  connect wallet and select account to view status
                </div>
              </Show>

              <Show when={selectedAccount() && stakingData()}>
                <div class="space-y-4">
                  <div class="p-4 bg-gray-900 border border-gray-700">
                    <div class="text-xs text-gray-500 mb-2">staking status</div>
                    <div class="text-lg font-mono">
                      {stakingData()?.validators ? (
                        <span class="text-green-400">validating</span>
                      ) : stakingData()?.nominators ? (
                        <span class="text-cyan-400">nominating</span>
                      ) : stakingData()?.bonded && stakingData()!.bonded > 0n ? (
                        <span class="text-yellow-400">bonded (not nominating)</span>
                      ) : (
                        <span class="text-gray-500">not staking</span>
                      )}
                    </div>
                  </div>

                  <Show when={stakingData()?.nominators && stakingData()!.nominators!.length > 0}>
                    <div class="p-4 bg-gray-900 border border-gray-700">
                      <div class="text-xs text-gray-500 mb-2">
                        nominating ({stakingData()!.nominators!.length})
                      </div>
                      <div class="space-y-1">
                        <For each={stakingData()!.nominators}>
                          {(addr) => (
                            <div class="font-mono text-xs text-gray-400">
                              {addr.slice(0, 16)}...{addr.slice(-8)}
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={stakingData()?.unlocking && stakingData()!.unlocking.length > 0}>
                    <div class="p-4 bg-gray-900 border border-gray-700">
                      <div class="text-xs text-gray-500 mb-2">unlocking</div>
                      <For each={stakingData()!.unlocking}>
                        {(u) => (
                          <div class="flex justify-between text-sm">
                            <span class="font-mono text-yellow-400">
                              {formatBalance(u.value)} {config().token}
                            </span>
                            <span class="text-gray-500">era {u.era}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        {/* Transaction Status */}
        <Show when={txStatus()}>
          <div class={`fixed bottom-4 right-4 p-4 border font-mono text-sm ${
            txStatus()!.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-400' :
            txStatus()!.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-400' :
            'bg-cyan-900/90 border-cyan-700 text-cyan-400'
          }`}>
            <div class="flex items-center gap-2">
              <Show when={txStatus()!.type === 'pending'}>
                <div class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              </Show>
              {txStatus()!.msg}
            </div>
            <button
              onClick={() => setTxStatus(null)}
              class="absolute top-1 right-2 text-gray-500 hover:text-white"
            >
              ×
            </button>
          </div>
        </Show>
      </div>
    </MainLayout>
  )
}

export default ValidatorPage
