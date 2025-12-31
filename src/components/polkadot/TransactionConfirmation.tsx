import { Component, Show, createSignal, createEffect } from 'solid-js'
import type { InjectedAccountWithMeta } from '../../types/polkadot'

export interface TransactionDetails {
  type: string
  description: string
  params: Record<string, string | number | bigint | string[]>
  warnings?: string[]
}

export interface ProxyOption {
  realAccount: string
  realAccountName?: string
  proxyType: string
  delay: number
}

interface TransactionConfirmationProps {
  show: boolean
  transaction: TransactionDetails | null
  signer: InjectedAccountWithMeta | null
  proxyOption?: ProxyOption | null
  estimatedFee?: bigint
  token: string
  decimals: number
  onConfirm: (useProxy: boolean) => Promise<void>
  onCancel: () => void
}

type TxStatus = 'idle' | 'signing' | 'submitting' | 'success' | 'error'

export const TransactionConfirmation: Component<TransactionConfirmationProps> = (props) => {
  const [status, setStatus] = createSignal<TxStatus>('idle')
  const [error, setError] = createSignal<string | null>(null)
  const [useProxy, setUseProxy] = createSignal(false)
  const [txHash, setTxHash] = createSignal<string | null>(null)

  // Reset state when modal opens
  createEffect(() => {
    if (props.show) {
      setStatus('idle')
      setError(null)
      setTxHash(null)
      // Default to proxy if available
      setUseProxy(!!props.proxyOption)
    }
  })

  const formatBalance = (value: bigint): string => {
    const divisor = 10n ** BigInt(props.decimals)
    const whole = value / divisor
    const decimal = ((value % divisor) * 10000n / divisor).toString().padStart(4, '0')
    return `${whole.toLocaleString()}.${decimal}`
  }

  const formatParamValue = (key: string, value: any): string => {
    if (typeof value === 'bigint') {
      return `${formatBalance(value)} ${props.token}`
    }
    if (Array.isArray(value)) {
      return `${value.length} items`
    }
    if (typeof value === 'string' && value.length > 20) {
      return `${value.slice(0, 10)}...${value.slice(-8)}`
    }
    return String(value)
  }

  const handleConfirm = async () => {
    setStatus('signing')
    setError(null)

    try {
      setStatus('submitting')
      await props.onConfirm(useProxy())
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Transaction failed')
    }
  }

  const getStatusMessage = () => {
    switch (status()) {
      case 'signing': return 'Waiting for signature...'
      case 'submitting': return 'Submitting transaction...'
      case 'success': return 'Transaction successful!'
      case 'error': return error() || 'Transaction failed'
      default: return null
    }
  }

  const getTypeIcon = () => {
    const type = props.transaction?.type?.toLowerCase() || ''
    if (type.includes('bond')) return '🔗'
    if (type.includes('unbond')) return '🔓'
    if (type.includes('nominate')) return '📋'
    if (type.includes('validate')) return '✓'
    if (type.includes('chill')) return '❄️'
    if (type.includes('key')) return '🔑'
    if (type.includes('withdraw')) return '💰'
    if (type.includes('payout') || type.includes('claim')) return '🎁'
    return '📝'
  }

  return (
    <Show when={props.show && props.transaction}>
      <div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div class="p-4 border-b border-gray-800 bg-gray-800/50">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{getTypeIcon()}</span>
              <div>
                <h3 class="font-bold text-white">{props.transaction?.type}</h3>
                <p class="text-sm text-gray-400">{props.transaction?.description}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div class="p-4 space-y-4">
            {/* Transaction Parameters */}
            <div class="space-y-2">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Parameters</div>
              <div class="bg-black rounded p-3 space-y-2">
                {Object.entries(props.transaction?.params || {}).map(([key, value]) => (
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-400">{key}</span>
                    <span class="text-white font-mono">
                      {formatParamValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signer Info */}
            <div class="space-y-2">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Signing Account</div>
              <div class="bg-black rounded p-3">
                <div class="font-medium text-white">{props.signer?.meta.name || 'Unknown'}</div>
                <div class="font-mono text-xs text-gray-500">
                  {props.signer?.address.slice(0, 12)}...{props.signer?.address.slice(-8)}
                </div>
              </div>
            </div>

            {/* Proxy Option */}
            <Show when={props.proxyOption}>
              <div class="space-y-2">
                <div class="text-xs text-gray-500 uppercase tracking-wide">Proxy Execution</div>
                <div class={`rounded p-3 border ${useProxy() ? 'bg-purple-900/20 border-purple-700' : 'bg-black border-gray-700'}`}>
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useProxy()}
                      onChange={(e) => setUseProxy(e.currentTarget.checked)}
                      class="mt-1 accent-purple-500"
                    />
                    <div class="flex-1">
                      <div class="text-sm text-white">Execute as proxy</div>
                      <div class="text-xs text-gray-400 mt-1">
                        Acting on behalf of: <span class="text-purple-400">{props.proxyOption?.realAccountName || props.proxyOption?.realAccount.slice(0, 12) + '...'}</span>
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        Proxy type: {props.proxyOption?.proxyType}
                        {props.proxyOption?.delay ? ` (${props.proxyOption.delay} block delay)` : ''}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </Show>

            {/* Fee Estimate */}
            <Show when={props.estimatedFee}>
              <div class="flex justify-between text-sm p-3 bg-black rounded">
                <span class="text-gray-400">Estimated Fee</span>
                <span class="text-white font-mono">
                  ~{formatBalance(props.estimatedFee!)} {props.token}
                </span>
              </div>
            </Show>

            {/* Warnings */}
            <Show when={props.transaction?.warnings?.length}>
              <div class="space-y-1">
                {props.transaction?.warnings?.map(warning => (
                  <div class="p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-400">
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            </Show>

            {/* Status */}
            <Show when={status() !== 'idle'}>
              <div class={`p-3 rounded text-sm ${
                status() === 'success' ? 'bg-green-900/20 border border-green-700 text-green-400' :
                status() === 'error' ? 'bg-red-900/20 border border-red-700 text-red-400' :
                'bg-blue-900/20 border border-blue-700 text-blue-400'
              }`}>
                <div class="flex items-center gap-2">
                  <Show when={status() === 'signing' || status() === 'submitting'}>
                    <div class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  </Show>
                  <Show when={status() === 'success'}>
                    <span>✓</span>
                  </Show>
                  <Show when={status() === 'error'}>
                    <span>✗</span>
                  </Show>
                  <span>{getStatusMessage()}</span>
                </div>
              </div>
            </Show>
          </div>

          {/* Actions */}
          <div class="p-4 border-t border-gray-800 flex gap-3">
            <Show when={status() === 'idle' || status() === 'error'}>
              <button
                onClick={props.onCancel}
                class="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                class="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-medium transition-colors"
              >
                {useProxy() ? 'Sign & Submit (Proxy)' : 'Sign & Submit'}
              </button>
            </Show>
            <Show when={status() === 'signing' || status() === 'submitting'}>
              <button
                disabled
                class="flex-1 px-4 py-2.5 bg-gray-700 rounded text-gray-400 cursor-not-allowed"
              >
                Processing...
              </button>
            </Show>
            <Show when={status() === 'success'}>
              <button
                onClick={props.onCancel}
                class="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 rounded text-white font-medium transition-colors"
              >
                Done
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
