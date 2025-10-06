import { ApiPromise, WsProvider } from '@polkadot/api'
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

export class PolkadotStakingService {
  private api: ApiPromise | null = null
  private chainId: ChainId

  constructor(chainId: ChainId) {
    this.chainId = chainId
  }

  async connect(endpoint: string) {
    const provider = new WsProvider(endpoint)
    this.api = await ApiPromise.create({ provider })
    await this.api.isReady
  }

  async disconnect() {
    if (this.api) {
      await this.api.disconnect()
    }
  }

  // Get current era information
  async getEraInfo(): Promise<EraInfo> {
    if (!this.api) throw new Error('Not connected')

    const [currentEra, activeEra, currentSlot, epochIndex, genesisSlot, epochOrSlot] = await Promise.all([
      this.api.query.staking.currentEra(),
      this.api.query.staking.activeEra(),
      this.api.query.babe?.currentSlot ? this.api.query.babe.currentSlot() : Promise.resolve(null),
      this.api.query.babe?.epochIndex ? this.api.query.babe.epochIndex() : Promise.resolve(null),
      this.api.query.babe?.genesisSlot ? this.api.query.babe.genesisSlot() : Promise.resolve(null),
      this.api.query.babe?.epochStart ? this.api.query.babe.epochStart() : Promise.resolve(null)
    ])

    const sessionLength = this.api.consts.babe?.epochDuration?.toNumber() || 2400
    const sessionsPerEra = this.api.consts.staking?.sessionsPerEra?.toNumber() || 6
    const currentSlotNumber = currentSlot ? currentSlot.toNumber() : 0
    const genesisSlotNumber = genesisSlot ? genesisSlot.toNumber() : 0

    const sessionProgress = currentSlotNumber && sessionLength ?
      ((currentSlotNumber - genesisSlotNumber) % sessionLength) / sessionLength * 100 : 0
    const eraProgress = currentSlotNumber && sessionLength && sessionsPerEra ?
      ((currentSlotNumber - genesisSlotNumber) % (sessionLength * sessionsPerEra)) / (sessionLength * sessionsPerEra) * 100 : 0
    const remainingBlocks = sessionLength && sessionsPerEra ?
      (sessionLength * sessionsPerEra) - ((currentSlotNumber - genesisSlotNumber) % (sessionLength * sessionsPerEra)) : 0

    return {
      currentEra: currentEra.unwrapOr(null)?.toNumber() || 0,
      activeEra: activeEra.unwrapOr(null)?.index.toNumber() || 0,
      sessionProgress,
      eraProgress,
      remainingBlocks
    }
  }

  // Get validator information
  async getValidatorInfo(address: string): Promise<ValidatorInfo | null> {
    if (!this.api) throw new Error('Not connected')

    const activeEra = await this.api.query.staking.activeEra()
    const activeEraIndex = activeEra.unwrapOr(null)?.index.toNumber() || 0

    const [prefs, exposure, ledger] = await Promise.all([
      this.api.query.staking.validators(address),
      this.api.query.staking.erasStakers(activeEraIndex, address),
      this.api.query.staking.ledger(address)
    ])

    if (!prefs || prefs.isEmpty) return null

    const nominators = exposure.others.map((nominator: any) => ({
      address: nominator.who.toString(),
      value: nominator.value.toString()
    }))

    // Check if exposure.total exists and handle both old and new API formats
    const totalStake = exposure.total ?
      (typeof exposure.total === 'object' && 'toString' in exposure.total ?
        exposure.total.toString() :
        String(exposure.total)) :
      '0'

    const ownStake = exposure.own ?
      (typeof exposure.own === 'object' && 'toString' in exposure.own ?
        exposure.own.toString() :
        String(exposure.own)) :
      '0'

    const isActive = BigInt(totalStake) > BigInt(0)
    const isWaiting = !isActive && ledger.isSome

    return {
      address,
      total: totalStake,
      own: ownStake,
      nominators,
      commission: prefs.commission.toNumber() / 10000000,
      blocked: prefs.blocked.isTrue,
      status: isActive ? 'active' : isWaiting ? 'waiting' : 'inactive'
    }
  }

  // Get staking information for an account
  async getStakingInfo(address: string): Promise<StakingInfo | null> {
    if (!this.api) throw new Error('Not connected')

    const [bonded, ledger, payee] = await Promise.all([
      this.api.query.staking.bonded(address),
      this.api.query.staking.ledger(address),
      this.api.query.staking.payee(address)
    ])

    if (!ledger.isSome) return null

    const ledgerData = ledger.unwrap()
    const eraInfo = await this.getEraInfo()

    const unlocking = ledgerData.unlocking.map((chunk: any) => ({
      value: chunk.value.toString(),
      era: chunk.era.toNumber()
    }))

    let redeemable = '0'
    for (const chunk of unlocking) {
      if (chunk.era <= eraInfo.activeEra) {
        redeemable = (BigInt(redeemable) + BigInt(chunk.value)).toString()
      }
    }

    const payeeStr = payee.isStaked ? 'Staked' :
                     payee.isStash ? 'Stash' :
                     payee.isController ? 'Controller' :
                     payee.isAccount ? payee.asAccount.toString() :
                     'Unknown'

    return {
      bonded: ledgerData.total.toString(),
      active: ledgerData.active.toString(),
      unlocking,
      redeemable,
      payee: payeeStr,
      claimed: await this.getClaimedRewards(ledgerData.stash.toString())
    }
  }

  // Get claimed rewards for a stash
  async getClaimedRewards(stash: string): Promise<number[]> {
    if (!this.api) throw new Error('Not connected')

    const eraInfo = await this.getEraInfo()
    const historyDepth = this.api.consts.staking.historyDepth?.toNumber() || 84
    const startEra = Math.max(0, eraInfo.activeEra - historyDepth)
    const claimed: number[] = []

    for (let era = startEra; era <= eraInfo.activeEra; era++) {
      const claimedRewards = await this.api.query.staking.claimedRewards(era, stash)
      if (claimedRewards && claimedRewards.length > 0) {
        claimed.push(era)
      }
    }

    return claimed
  }

  // Get all validators
  async getAllValidators(): Promise<string[]> {
    if (!this.api) throw new Error('Not connected')

    const validators = await this.api.query.staking.validators.entries()
    return validators.map(([key]) => key.args[0].toString())
  }

  // Get active validators for current era
  async getActiveValidators(): Promise<ValidatorInfo[]> {
    if (!this.api) throw new Error('Not connected')

    const activeEra = await this.api.query.staking.activeEra()
    const activeEraIndex = activeEra.unwrapOr(null)?.index.toNumber() || 0

    const stakers = await this.api.query.staking.erasStakers.entries(activeEraIndex)

    const validatorInfos = await Promise.all(
      stakers.map(async ([key, exposure]) => {
        const address = key.args[1].toString()
        return this.getValidatorInfo(address)
      })
    )

    return validatorInfos.filter(v => v !== null) as ValidatorInfo[]
  }

  // Get nominator info
  async getNominatorInfo(address: string): Promise<NominatorInfo | null> {
    if (!this.api) throw new Error('Not connected')

    const nomination = await this.api.query.staking.nominators(address)

    if (!nomination.isSome) return null

    const nominationData = nomination.unwrap()

    return {
      address,
      targets: nominationData.targets.map((t: any) => t.toString()),
      submittedIn: nominationData.submittedIn.toNumber()
    }
  }

  // Watch validator changes
  watchValidator(address: string, callback: (info: ValidatorInfo | null) => void) {
    if (!this.api) throw new Error('Not connected')

    const unsubscribe = this.api.query.staking.activeEra(async () => {
      const info = await this.getValidatorInfo(address)
      callback(info)
    })

    return unsubscribe
  }

  // Watch era changes
  watchEraInfo(callback: (info: EraInfo) => void) {
    if (!this.api) throw new Error('Not connected')

    const unsubscribe = this.api.query.staking.currentEra(async () => {
      const info = await this.getEraInfo()
      callback(info)
    })

    return unsubscribe
  }

  // Get minimum bond amounts
  async getMinimumAmounts() {
    if (!this.api) throw new Error('Not connected')

    const [minNominatorBond, minValidatorBond, minActiveStake] = await Promise.all([
      this.api.query.staking.minNominatorBond(),
      this.api.query.staking.minValidatorBond(),
      this.api.query.staking.minimumActiveStake ?
        this.api.query.staking.minimumActiveStake() :
        Promise.resolve('0')
    ])

    return {
      minNominatorBond: minNominatorBond.toString(),
      minValidatorBond: minValidatorBond.toString(),
      minActiveStake: minActiveStake ? minActiveStake.toString() : '0'
    }
  }

  // Get slash info
  async getSlashInfo(era: number) {
    if (!this.api) throw new Error('Not connected')

    const slashes = await this.api.query.staking.unappliedSlashes(era)
    return slashes || []
  }
}