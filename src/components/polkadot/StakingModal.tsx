import { Component, Show, createSignal, createEffect, For } from 'solid-js'
import type { InjectedAccountWithMeta } from '../../types/polkadot'

export type OperationType = 'bond' | 'unbond' | 'nominate' | 'setKeys' | 'rebond' | 'withdrawUnbonded'

interface StakingModalProps {
  show: boolean
  operation: OperationType
  account: InjectedAccountWithMeta | null
  token: string
  decimals: number
  currentBonded?: bigint
  maxBalance?: bigint
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export const StakingModal: Component<StakingModalProps> = (props) => {
  const [amount, setAmount] = createSignal('')
  const [payee, setPayee] = createSignal<'Staked' | 'Stash' | 'Account'>('Staked')
  const [controller, setController] = createSignal('')
  const [validators, setValidators] = createSignal<string[]>([])
  const [validatorInput, setValidatorInput] = createSignal('')
  const [sessionKeys, setSessionKeys] = createSignal('')
  const [keyProof, setKeyProof] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  // Reset form when modal opens
  createEffect(() => {
    if (props.show) {
      setAmount('')
      setPayee('Staked')
      setController(props.account?.address || '')
      setValidators([])
      setValidatorInput('')
      setSessionKeys('')
      setKeyProof('')
      setError(null)
    }
  })

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value)
      setError(null)
    }
  }

  const parseAmount = (): bigint | null => {
    if (!amount()) return null
    try {
      const parts = amount().split('.')
      const wholePart = BigInt(parts[0] || 0)
      const decimalPart = parts[1] || ''
      const paddedDecimal = decimalPart.padEnd(props.decimals, '0').slice(0, props.decimals)
      const decimalValue = BigInt(paddedDecimal)
      return wholePart * (10n ** BigInt(props.decimals)) + decimalValue
    } catch {
      return null
    }
  }

  const validateAmount = (): boolean => {
    const parsed = parseAmount()
    if (!parsed || parsed <= 0n) {
      setError('Please enter a valid amount')
      return false
    }

    if (props.operation === 'bond' && props.maxBalance && parsed > props.maxBalance) {
      setError('Amount exceeds available balance')
      return false
    }

    if (props.operation === 'unbond' && props.currentBonded && parsed > props.currentBonded) {
      setError('Amount exceeds bonded balance')
      return false
    }

    return true
  }

  const addValidator = () => {
    const input = validatorInput().trim()
    if (input && !validators().includes(input)) {
      setValidators([...validators(), input])
      setValidatorInput('')
    }
  }

  const removeValidator = (address: string) => {
    setValidators(validators().filter(v => v !== address))
  }

  const handleSubmit = async () => {
    setError(null)

    // Validate based on operation type
    if (props.operation === 'bond' || props.operation === 'unbond' || props.operation === 'rebond') {
      if (!validateAmount()) return
    }

    if (props.operation === 'nominate' && validators().length === 0) {
      setError('Please select at least one validator')
      return
    }

    if (props.operation === 'setKeys' && !sessionKeys()) {
      setError('Please enter session keys')
      return
    }

    setIsSubmitting(true)

    try {
      const data: any = {}

      switch (props.operation) {
        case 'bond':
          data.amount = parseAmount()
          data.controller = controller()
          data.payee = payee()
          break
        case 'unbond':
        case 'rebond':
          data.amount = parseAmount()
          break
        case 'nominate':
          data.validators = validators()
          break
        case 'setKeys':
          data.keys = sessionKeys()
          data.proof = keyProof() || '0x'
          break
        case 'withdrawUnbonded':
          data.numSlashingSpans = 0
          break
      }

      await props.onSubmit(data)
      props.onClose()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatBalance = (balance: bigint): string => {
    const divisor = 10n ** BigInt(props.decimals)
    const wholePart = balance / divisor
    const decimalPart = balance % divisor
    const decimalStr = decimalPart.toString().padStart(props.decimals, '0').slice(0, 4)
    return `${wholePart.toLocaleString()}.${decimalStr}`
  }

  const getTitle = () => {
    switch (props.operation) {
      case 'bond': return 'Bond Tokens'
      case 'unbond': return 'Unbond Tokens'
      case 'rebond': return 'Rebond Tokens'
      case 'nominate': return 'Select Validators'
      case 'setKeys': return 'Set Session Keys'
      case 'withdrawUnbonded': return 'Withdraw Unbonded'
      default: return 'Staking Operation'
    }
  }

  return (
    <Show when={props.show}>
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold text-cyan-400 mb-4">{getTitle()}</h3>

          <Show when={props.account}>
            <div class="mb-4 p-3 bg-gray-800 rounded">
              <div class="text-xs text-gray-400 mb-1">Account</div>
              <div class="font-mono text-sm">{props.account?.meta.name}</div>
              <div class="font-mono text-xs text-gray-500">{props.account?.address.slice(0, 8)}...{props.account?.address.slice(-6)}</div>
            </div>
          </Show>

          {/* Bond Form */}
          <Show when={props.operation === 'bond'}>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Amount to Bond</label>
                <div class="relative">
                  <input
                    type="text"
                    placeholder="0.0"
                    value={amount()}
                    onInput={(e) => handleAmountChange(e.currentTarget.value)}
                    class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <span class="absolute right-3 top-2 text-gray-400">{props.token}</span>
                </div>
                <Show when={props.maxBalance}>
                  <div class="text-xs text-gray-500 mt-1">
                    Available: {formatBalance(props.maxBalance!)} {props.token}
                  </div>
                </Show>
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-2">Controller Account</label>
                <input
                  type="text"
                  value={controller()}
                  onInput={(e) => setController(e.currentTarget.value)}
                  placeholder="Same as stash"
                  class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-2">Reward Destination</label>
                <select
                  value={payee()}
                  onChange={(e) => setPayee(e.currentTarget.value as any)}
                  class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Staked">Staked (compound)</option>
                  <option value="Stash">Stash (liquid)</option>
                  <option value="Account">Custom Account</option>
                </select>
              </div>
            </div>
          </Show>

          {/* Unbond/Rebond Form */}
          <Show when={props.operation === 'unbond' || props.operation === 'rebond'}>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">
                  Amount to {props.operation === 'unbond' ? 'Unbond' : 'Rebond'}
                </label>
                <div class="relative">
                  <input
                    type="text"
                    placeholder="0.0"
                    value={amount()}
                    onInput={(e) => handleAmountChange(e.currentTarget.value)}
                    class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <span class="absolute right-3 top-2 text-gray-400">{props.token}</span>
                </div>
                <Show when={props.currentBonded}>
                  <div class="text-xs text-gray-500 mt-1">
                    Currently Bonded: {formatBalance(props.currentBonded!)} {props.token}
                  </div>
                </Show>
              </div>

              <Show when={props.operation === 'unbond'}>
                <div class="p-3 bg-yellow-900/20 border border-yellow-700 rounded text-sm text-yellow-400">
                  ⚠️ Unbonding period is 28 days on Polkadot, 7 days on Kusama
                </div>
              </Show>
            </div>
          </Show>

          {/* Nominate Form */}
          <Show when={props.operation === 'nominate'}>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Validator Address</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter validator address"
                    value={validatorInput()}
                    onInput={(e) => setValidatorInput(e.currentTarget.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addValidator()}
                    class="flex-1 px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none font-mono text-xs"
                  />
                  <button
                    onClick={addValidator}
                    class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              <Show when={validators().length > 0}>
                <div>
                  <div class="text-sm text-gray-400 mb-2">Selected Validators ({validators().length}/16)</div>
                  <div class="space-y-2 max-h-48 overflow-y-auto">
                    <For each={validators()}>
                      {(validator) => (
                        <div class="flex items-center justify-between p-2 bg-gray-800 rounded">
                          <span class="font-mono text-xs">{validator.slice(0, 12)}...{validator.slice(-8)}</span>
                          <button
                            onClick={() => removeValidator(validator)}
                            class="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              <div class="p-3 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-400">
                ℹ️ You can nominate up to 16 validators. Choose validators with good performance and low commission.
              </div>
            </div>
          </Show>

          {/* Set Keys Form */}
          <Show when={props.operation === 'setKeys'}>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Session Keys</label>
                <textarea
                  placeholder="0x..."
                  value={sessionKeys()}
                  onInput={(e) => setSessionKeys(e.currentTarget.value)}
                  rows={3}
                  class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-2">Proof (optional)</label>
                <input
                  type="text"
                  placeholder="0x... or leave empty"
                  value={keyProof()}
                  onInput={(e) => setKeyProof(e.currentTarget.value)}
                  class="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:border-cyan-400 focus:outline-none font-mono text-xs"
                />
              </div>

              <div class="p-3 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-400">
                ℹ️ Generate session keys on your validator node using: author_rotateKeys
              </div>
            </div>
          </Show>

          {/* Withdraw Unbonded Info */}
          <Show when={props.operation === 'withdrawUnbonded'}>
            <div class="p-4 bg-gray-800 rounded">
              <p class="text-sm text-gray-300 mb-3">
                This will withdraw all tokens that have completed their unbonding period.
              </p>
              <p class="text-xs text-gray-500">
                Tokens become available after the unbonding period (28 days on Polkadot, 7 days on Kusama).
              </p>
            </div>
          </Show>

          {/* Error Display */}
          <Show when={error()}>
            <div class="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
              {error()}
            </div>
          </Show>

          {/* Actions */}
          <div class="mt-6 flex gap-3 justify-end">
            <button
              onClick={props.onClose}
              disabled={isSubmitting()}
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting()}
              class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white disabled:opacity-50"
            >
              {isSubmitting() ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}