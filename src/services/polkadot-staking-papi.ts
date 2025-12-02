import { createClient, type PolkadotClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import type { ChainId } from '../types/polkadot'

export interface ValidatorInfo {
  address: string
  total: string
  own: string
  nominators: Array<{
    address: string
    value: string
  }>
  commission: number
  blocked: boolean
  status: 'active' | 'waiting' | 'inactive'
}

export interface EraInfo {
  currentEra: number
  activeEra: number
  sessionProgress: number
  eraProgress: number
  remainingBlocks: number
}

export interface StakingInfo {
  bonded: string
  active: string
  unlocking: Array<{
    value: string
    era: number
  }>
  redeemable: string
  payee: string
  claimed: number[]
}

export interface NominatorInfo {
  address: string
  targets: string[]
  submittedIn: number
}

export class PolkadotStakingServicePapi {
  private client: PolkadotClient | null = null
  private chainId: ChainId
  private unsubscribers: (() => void)[] = []

  constructor(chainId: ChainId) {
    this.chainId = chainId
  }

  async connect(endpoint: string) {
    const provider = getWsProvider(endpoint)
    this.client = createClient(provider)
  }

  async disconnect() {
    // Clean up any subscriptions
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []

    if (this.client) {
      this.client.destroy()
      this.client = null
    }
  }

  // Get current era information
  async getEraInfo(): Promise<EraInfo> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()

    const [currentEra, activeEra] = await Promise.all([
      api.query.Staking.CurrentEra.getValue(),
      api.query.Staking.ActiveEra.getValue()
    ])

    // Get session/epoch info if available
    let sessionProgress = 0
    let eraProgress = 0
    let remainingBlocks = 0

    try {
      // Try to get babe epoch info for progress calculation
      const currentSlot = await api.query.Babe?.CurrentSlot?.getValue()
      const genesisSlot = await api.query.Babe?.GenesisSlot?.getValue()

      // Get constants for calculation
      const epochDuration = await api.constants?.Babe?.EpochDuration?.()
      const sessionsPerEra = await api.constants?.Staking?.SessionsPerEra?.()

      const sessionLength = Number(epochDuration || 2400)
      const sessionsCount = Number(sessionsPerEra || 6)
      const currentSlotNum = Number(currentSlot || 0)
      const genesisSlotNum = Number(genesisSlot || 0)

      if (currentSlotNum && sessionLength) {
        sessionProgress = ((currentSlotNum - genesisSlotNum) % sessionLength) / sessionLength * 100
        eraProgress = ((currentSlotNum - genesisSlotNum) % (sessionLength * sessionsCount)) / (sessionLength * sessionsCount) * 100
        remainingBlocks = (sessionLength * sessionsCount) - ((currentSlotNum - genesisSlotNum) % (sessionLength * sessionsCount))
      }
    } catch (e) {
      console.warn('Could not get session progress info:', e)
    }

    return {
      currentEra: currentEra || 0,
      activeEra: activeEra?.index || 0,
      sessionProgress,
      eraProgress,
      remainingBlocks
    }
  }

  // Get validator information
  async getValidatorInfo(address: string): Promise<ValidatorInfo | null> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()

    const activeEra = await api.query.Staking.ActiveEra.getValue()
    const activeEraIndex = activeEra?.index || 0

    const [prefs, exposure, ledger] = await Promise.all([
      api.query.Staking.Validators.getValue(address),
      api.query.Staking.ErasStakers.getValue(activeEraIndex, address),
      api.query.Staking.Ledger.getValue(address)
    ])

    if (!prefs) return null

    const nominators = (exposure?.others || []).map((nominator: any) => ({
      address: nominator.who?.toString() || nominator.toString(),
      value: (nominator.value?.toString() || '0')
    }))

    const totalStake = exposure?.total?.toString() || '0'
    const ownStake = exposure?.own?.toString() || '0'

    const isActive = BigInt(totalStake) > BigInt(0)
    const isWaiting = !isActive && !!ledger

    return {
      address,
      total: totalStake,
      own: ownStake,
      nominators,
      commission: (prefs.commission || 0) / 10000000,
      blocked: prefs.blocked || false,
      status: isActive ? 'active' : isWaiting ? 'waiting' : 'inactive'
    }
  }

  // Get staking information for an account
  async getStakingInfo(address: string): Promise<StakingInfo | null> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()

    const [bonded, ledger, payee] = await Promise.all([
      api.query.Staking.Bonded.getValue(address),
      api.query.Staking.Ledger.getValue(address),
      api.query.Staking.Payee.getValue(address)
    ])

    if (!ledger) return null

    const eraInfo = await this.getEraInfo()

    const unlocking = (ledger.unlocking || []).map((chunk: any) => ({
      value: chunk.value?.toString() || '0',
      era: Number(chunk.era || 0)
    }))

    let redeemable = '0'
    for (const chunk of unlocking) {
      if (chunk.era <= eraInfo.activeEra) {
        redeemable = (BigInt(redeemable) + BigInt(chunk.value)).toString()
      }
    }

    // Parse payee
    let payeeStr = 'Unknown'
    if (payee) {
      if (typeof payee === 'object' && 'type' in payee) {
        payeeStr = payee.type === 'Account' ? payee.value?.toString() || 'Account' : payee.type
      } else if (typeof payee === 'string') {
        payeeStr = payee
      }
    }

    return {
      bonded: ledger.total?.toString() || '0',
      active: ledger.active?.toString() || '0',
      unlocking,
      redeemable,
      payee: payeeStr,
      claimed: await this.getClaimedRewards(ledger.stash?.toString() || address)
    }
  }

  // Get claimed rewards for a stash
  async getClaimedRewards(stash: string): Promise<number[]> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()

    const eraInfo = await this.getEraInfo()
    const historyDepth = await api.constants?.Staking?.HistoryDepth?.() || 84
    const startEra = Math.max(0, eraInfo.activeEra - Number(historyDepth))
    const claimed: number[] = []

    for (let era = startEra; era <= eraInfo.activeEra; era++) {
      try {
        const claimedRewards = await api.query.Staking.ClaimedRewards?.getValue(era, stash)
        if (claimedRewards && (Array.isArray(claimedRewards) ? claimedRewards.length > 0 : claimedRewards)) {
          claimed.push(era)
        }
      } catch (e) {
        // Continue if individual era check fails
      }
    }

    return claimed
  }

  // Get all validators
  async getAllValidators(): Promise<string[]> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()
    const validators = await api.query.Staking.Validators.getEntries()
    return validators.map(({ keyArgs }) => keyArgs[0]?.toString() || '')
  }

  // Get active validators for current era
  async getActiveValidators(): Promise<ValidatorInfo[]> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()

    const activeEra = await api.query.Staking.ActiveEra.getValue()
    const activeEraIndex = activeEra?.index || 0

    const stakers = await api.query.Staking.ErasStakers.getEntries(activeEraIndex)

    const validatorInfos = await Promise.all(
      stakers.map(async ({ keyArgs }) => {
        const address = keyArgs[1]?.toString() || ''
        return this.getValidatorInfo(address)
      })
    )

    return validatorInfos.filter((v): v is ValidatorInfo => v !== null)
  }

  // Get nominator info
  async getNominatorInfo(address: string): Promise<NominatorInfo | null> {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()
    const nomination = await api.query.Staking.Nominators.getValue(address)

    if (!nomination) return null

    return {
      address,
      targets: (nomination.targets || []).map((t: any) => t?.toString() || ''),
      submittedIn: Number(nomination.submittedIn || 0)
    }
  }

  // Watch validator changes - returns unsubscribe function
  watchValidator(address: string, callback: (info: ValidatorInfo | null) => void): () => void {
    if (!this.client) throw new Error('Not connected')

    let active = true

    // Poll-based watching since papi subscriptions work differently
    const poll = async () => {
      if (!active) return
      try {
        const info = await this.getValidatorInfo(address)
        if (active) callback(info)
      } catch (e) {
        console.warn('Error polling validator info:', e)
      }
    }

    // Initial fetch
    poll()

    // Set up polling interval (every 12 seconds = ~2 blocks)
    const interval = setInterval(poll, 12000)

    const unsubscribe = () => {
      active = false
      clearInterval(interval)
    }

    this.unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // Watch era changes - returns unsubscribe function
  watchEraInfo(callback: (info: EraInfo) => void): () => void {
    if (!this.client) throw new Error('Not connected')

    let active = true

    const poll = async () => {
      if (!active) return
      try {
        const info = await this.getEraInfo()
        if (active) callback(info)
      } catch (e) {
        console.warn('Error polling era info:', e)
      }
    }

    // Initial fetch
    poll()

    // Set up polling interval (every 6 seconds = ~1 block)
    const interval = setInterval(poll, 6000)

    const unsubscribe = () => {
      active = false
      clearInterval(interval)
    }

    this.unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // Get minimum bond amounts
  async getMinimumAmounts() {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()

    const [minNominatorBond, minValidatorBond, minActiveStake] = await Promise.all([
      api.query.Staking.MinNominatorBond.getValue(),
      api.query.Staking.MinValidatorBond.getValue(),
      api.query.Staking.MinimumActiveStake?.getValue().catch(() => '0')
    ])

    return {
      minNominatorBond: minNominatorBond?.toString() || '0',
      minValidatorBond: minValidatorBond?.toString() || '0',
      minActiveStake: minActiveStake?.toString() || '0'
    }
  }

  // Get slash info
  async getSlashInfo(era: number) {
    if (!this.client) throw new Error('Not connected')

    const api = await this.client.getUnsafeApi()
    const slashes = await api.query.Staking.UnappliedSlashes?.getValue(era)
    return slashes || []
  }
}
