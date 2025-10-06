import { Component, createSignal, Show, For, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import { usePolkadot } from '../../contexts/PolkadotProvider'
import type { ProxyAccount, ProxyDefinition, InjectedAccountWithMeta } from '../../types/polkadot'

interface ProxyManagerProps {
  connectedAccounts: InjectedAccountWithMeta[]
  onProxyAdded?: (proxy: ProxyAccount) => void
}

export const ProxyManager: Component<ProxyManagerProps> = (props) => {
  const polkadot = usePolkadot()
  const [proxyAccounts, setProxyAccounts] = createStore<ProxyAccount[]>([])
  const [isAddingProxy, setIsAddingProxy] = createSignal(false)
  const [proxyAddress, setProxyAddress] = createSignal('')
  const [proxyNickname, setProxyNickname] = createSignal('')
  const [validationStatus, setValidationStatus] = createSignal<{
    isValidating: boolean
    isValid: boolean
    message: string
    proxyDef?: ProxyDefinition
  }>({
    isValidating: false,
    isValid: false,
    message: ''
  })

  // Load saved proxy accounts from localStorage
  const loadSavedProxies = () => {
    const saved = localStorage.getItem('rotko_proxy_accounts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProxyAccounts(parsed)
      } catch (err) {
        console.error('Failed to load saved proxies:', err)
      }
    }
  }

  // Save proxy accounts to localStorage
  const saveProxies = () => {
    localStorage.setItem('rotko_proxy_accounts', JSON.stringify(proxyAccounts))
  }

  // Validate proxy address
  const validateProxy = async () => {
    const address = proxyAddress().trim()

    if (!address) {
      setValidationStatus({
        isValidating: false,
        isValid: false,
        message: 'Please enter a proxy address'
      })
      return
    }

    // Check if address is valid format (basic check)
    if (address.length !== 48 && address.length !== 47) {
      setValidationStatus({
        isValidating: false,
        isValid: false,
        message: 'Invalid address format'
      })
      return
    }

    setValidationStatus({
      isValidating: true,
      isValid: false,
      message: 'Validating proxy access...'
    })

    try {
      // Get all connected account addresses
      const delegatorAddresses = props.connectedAccounts.map(acc => acc.address)

      // Validate proxy access
      const proxyDef = await polkadot.validateProxyAccess(address, delegatorAddresses)

      if (proxyDef) {
        // Find which account gave proxy access
        const delegator = props.connectedAccounts.find(acc => {
          // We'll need to check this account's proxies
          return true // Simplified - in reality we'd check which account has this proxy
        })

        setValidationStatus({
          isValidating: false,
          isValid: true,
          message: `Valid proxy! Type: ${proxyDef.proxyType}${proxyDef.delay > 0 ? ` (${proxyDef.delay} block delay)` : ''}`,
          proxyDef
        })
      } else {
        setValidationStatus({
          isValidating: false,
          isValid: false,
          message: 'This address does not have proxy access to any of your connected accounts'
        })
      }
    } catch (err) {
      console.error('Failed to validate proxy:', err)
      setValidationStatus({
        isValidating: false,
        isValid: false,
        message: 'Failed to validate proxy access'
      })
    }
  }

  const addProxy = async () => {
    if (!validationStatus().isValid || !validationStatus().proxyDef) return

    const address = proxyAddress().trim()
    const nickname = proxyNickname().trim() || `Proxy ${proxyAccounts.length + 1}`

    // Find the delegator account
    const delegatorAddresses = props.connectedAccounts.map(acc => acc.address)
    const proxyDef = await polkadot.validateProxyAccess(address, delegatorAddresses)

    if (!proxyDef) return

    // For now, we'll assume the first account that has this proxy
    // In production, we'd need to check each account's proxies
    const delegator = props.connectedAccounts[0]

    const newProxy: ProxyAccount = {
      address,
      delegator: delegator.address,
      proxyType: proxyDef.proxyType,
      delay: proxyDef.delay,
      nickname
    }

    setProxyAccounts([...proxyAccounts, newProxy])
    saveProxies()
    props.onProxyAdded?.(newProxy)

    // Reset form
    setProxyAddress('')
    setProxyNickname('')
    setIsAddingProxy(false)
    setValidationStatus({
      isValidating: false,
      isValid: false,
      message: ''
    })
  }

  const removeProxy = (index: number) => {
    const updated = proxyAccounts.filter((_, i) => i !== index)
    setProxyAccounts(updated)
    saveProxies()
  }

  const getProxyTypeColor = (type: string) => {
    switch (type) {
      case 'Any': return 'text-red-400 bg-red-900/30'
      case 'NonTransfer': return 'text-yellow-400 bg-yellow-900/30'
      case 'Staking': return 'text-green-400 bg-green-900/30'
      case 'Governance': return 'text-blue-400 bg-blue-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  const getProxyTypeDescription = (type: string) => {
    switch (type) {
      case 'Any': return 'Full control over the account'
      case 'NonTransfer': return 'All actions except transfers'
      case 'Staking': return 'Staking operations only'
      case 'Governance': return 'Governance voting only'
      case 'IdentityJudgement': return 'Identity judgement operations'
      case 'CancelProxy': return 'Can only cancel proxy relationships'
      case 'Auction': return 'Parachain auction operations'
      default: return 'Unknown proxy type'
    }
  }

  // Load saved proxies on mount
  loadSavedProxies()

  return (
    <div class="border border-gray-700 bg-gray-900 p-6 rounded">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-cyan-400">Proxy Accounts</h3>
          <p class="text-sm text-gray-400 mt-1">
            Manage accounts that have proxy access to your wallets
          </p>
        </div>
        <button
          onClick={() => setIsAddingProxy(true)}
          class="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
        >
          Add Proxy
        </button>
      </div>

      <Show when={isAddingProxy()}>
        <div class="mb-4 p-4 bg-black border border-gray-600 rounded">
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Proxy Address</label>
              <input
                type="text"
                value={proxyAddress()}
                onInput={(e) => setProxyAddress(e.currentTarget.value)}
                onBlur={validateProxy}
                placeholder="Enter proxy account address"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-1">Nickname (optional)</label>
              <input
                type="text"
                value={proxyNickname()}
                onInput={(e) => setProxyNickname(e.currentTarget.value)}
                placeholder="e.g., Hot Wallet, Validator Controller"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <Show when={validationStatus().message}>
              <div class={`text-sm p-2 rounded ${
                validationStatus().isValid ? 'bg-green-900/30 text-green-400' :
                validationStatus().isValidating ? 'bg-blue-900/30 text-blue-400' :
                'bg-red-900/30 text-red-400'
              }`}>
                {validationStatus().message}
              </div>
            </Show>

            <div class="flex gap-2">
              <button
                onClick={addProxy}
                disabled={!validationStatus().isValid || validationStatus().isValidating}
                class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm"
              >
                Add Proxy Account
              </button>
              <button
                onClick={() => {
                  setIsAddingProxy(false)
                  setProxyAddress('')
                  setProxyNickname('')
                  setValidationStatus({ isValidating: false, isValid: false, message: '' })
                }}
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={proxyAccounts.length > 0}>
        <div class="space-y-3">
          <For each={proxyAccounts}>
            {(proxy, index) => (
              <div class="p-4 bg-black border border-gray-700 rounded">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <div class="font-mono text-sm text-cyan-400">{proxy.nickname}</div>
                      <span class={`px-2 py-1 text-xs rounded ${getProxyTypeColor(proxy.proxyType)}`}>
                        {proxy.proxyType}
                      </span>
                      <Show when={proxy.delay > 0}>
                        <span class="text-xs text-gray-500">
                          {proxy.delay} block delay
                        </span>
                      </Show>
                    </div>
                    <div class="font-mono text-xs text-gray-500 mt-1">
                      {proxy.address.slice(0, 8)}...{proxy.address.slice(-6)}
                    </div>
                    <div class="text-xs text-gray-400 mt-2">
                      {getProxyTypeDescription(proxy.proxyType)}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      Delegated by: {proxy.delegator.slice(0, 8)}...{proxy.delegator.slice(-6)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeProxy(index())}
                    class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs ml-4"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={proxyAccounts.length === 0 && !isAddingProxy()}>
        <div class="text-center py-8 text-gray-500">
          <div class="mb-2">No proxy accounts added yet</div>
          <div class="text-sm">
            Add proxy accounts that can perform operations on behalf of your wallets
          </div>
        </div>
      </Show>
    </div>
  )
}