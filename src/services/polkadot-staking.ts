import { createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { chainSpec } from "polkadot-api/chains/polkadot"
import { chainSpec as kusamaChainSpec } from "polkadot-api/chains/ksmcc3"
import { chainSpec as paseoChainSpec } from "polkadot-api/chains/paseo"
import { dot, ksm, pas } from "../codegen/descriptors"
import type { ChainId } from '../types/polkadot'

export interface ValidatorInfo {
  address: string
  total: bigint
  own: bigint
  nominators: Array<{
    address: string
    value: bigint
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
  bonded: bigint
  active: bigint
  unlocking: Array<{
    value: bigint
    era: number
  }>
  redeemable: bigint
  payee: string
  claimed: number[]
}

export interface NominatorInfo {
  address: string
  targets: string[]
  submittedIn: number
}

const CHAIN_SPECS = {
  polkadot: chainSpec,
  kusama: kusamaChainSpec,
  paseo: paseoChainSpec
}

const DESCRIPTORS = {
  polkadot: dot,
  kusama: ksm,
  paseo: pas
}

export class PolkadotStakingService {
  private client: any
  private typedApi: any
  private chainId: ChainId

  constructor(chainId: ChainId, endpoint: string) {
    this.chainId = chainId
  }

  async connect(endpoint: string) {
    const provider = getWsProvider(endpoint)

    // For light client support (browser-first approach)
    // const smProvider = getSmProvider(provider)

    this.client = createClient(provider)

    // Get the appropriate descriptor for the chain
    const descriptor = DESCRIPTORS[this.chainId]
    this.typedApi = this.client.getTypedApi(descriptor)
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy()
    }
  }

  // Get current era information
  async getEraInfo(): Promise<EraInfo> {
    const [currentEra, activeEra, currentSlot, genesisSlot, sessionLength, epochLength] = await Promise.all([
      this.typedApi.query.Staking.CurrentEra.getValue(),
      this.typedApi.query.Staking.ActiveEra.getValue(),
      this.typedApi.query.Babe?.CurrentSlot?.getValue() || 0,
      this.typedApi.query.Babe?.GenesisSlot?.getValue() || 0,
      this.typedApi.constants.Babe?.EpochDuration || 2400,
      this.typedApi.constants.Staking?.SessionsPerEra || 6
    ])

    const sessionProgress = ((currentSlot - genesisSlot) % sessionLength) / sessionLength * 100
    const eraProgress = ((currentSlot - genesisSlot) % (sessionLength * epochLength)) / (sessionLength * epochLength) * 100
    const remainingBlocks = (sessionLength * epochLength) - ((currentSlot - genesisSlot) % (sessionLength * epochLength))

    return {
      currentEra: currentEra?.value || 0,
      activeEra: activeEra?.value.index || 0,
      sessionProgress,
      eraProgress,
      remainingBlocks
    }
  }

  // Get validator information
  async getValidatorInfo(address: string): Promise<ValidatorInfo | null> {
    const [prefs, exposure, blocked] = await Promise.all([
      this.typedApi.query.Staking.Validators.getValue(address),
      this.typedApi.query.Staking.ErasStakersOverview.getValue(
        (await this.typedApi.query.Staking.ActiveEra.getValue())?.value.index || 0,
        address
      ),
      false // Need to check if validator is in invulnerables
    ])

    if (!prefs) return null

    const nominators = exposure?.pageCount ?
      await this.getNominatorsPaged(address, exposure.pageCount) : []

    return {
      address,
      total: exposure?.total || 0n,
      own: exposure?.own || 0n,
      nominators,
      commission: prefs.commission / 10000000, // Convert from Perbill
      blocked: prefs.blocked,
      status: exposure ? 'active' : 'waiting'
    }
  }

  // Get nominators for a validator (paged)
  async getNominatorsPaged(validator: string, pageCount: number) {
    const activeEra = (await this.typedApi.query.Staking.ActiveEra.getValue())?.value.index || 0
    const nominators: Array<{address: string, value: bigint}> = []

    for (let page = 0; page < pageCount; page++) {
      const pageData = await this.typedApi.query.Staking.ErasStakersPaged.getValue(
        activeEra,
        validator,
        page
      )

      if (pageData?.others) {
        nominators.push(...pageData.others.map((n: any) => ({
          address: n.who,
          value: n.value
        })))
      }
    }

    return nominators
  }

  // Get staking information for an account
  async getStakingInfo(address: string): Promise<StakingInfo | null> {
    const [bonded, ledger, payee] = await Promise.all([
      this.typedApi.query.Staking.Bonded.getValue(address),
      this.typedApi.query.Staking.Ledger.getValue(address),
      this.typedApi.query.Staking.Payee.getValue(address)
    ])

    if (!ledger) return null

    return {
      bonded: ledger.total,
      active: ledger.active,
      unlocking: ledger.unlocking.map((u: any) => ({
        value: u.value,
        era: u.era
      })),
      redeemable: this.calculateRedeemable(ledger, await this.getEraInfo()),
      payee: this.formatPayee(payee),
      claimed: await this.getClaimedRewards(address, ledger.stash)
    }
  }

  // Calculate redeemable balance
  private calculateRedeemable(ledger: any, eraInfo: EraInfo): bigint {
    let redeemable = 0n

    for (const chunk of ledger.unlocking) {
      if (chunk.era <= eraInfo.activeEra) {
        redeemable += chunk.value
      }
    }

    return redeemable
  }

  // Format payee destination
  private formatPayee(payee: any): string {
    if (typeof payee === 'string') return payee
    if (payee?.type === 'Staked') return 'Staked'
    if (payee?.type === 'Stash') return 'Stash'
    if (payee?.type === 'Account') return payee.value
    return 'Unknown'
  }

  // Get claimed rewards for a stash
  async getClaimedRewards(stash: string, era?: number): Promise<number[]> {
    const currentEra = era || (await this.getEraInfo()).activeEra
    const claimed: number[] = []

    // Check last 84 eras (default history depth)
    const startEra = Math.max(0, currentEra - 84)

    for (let e = startEra; e <= currentEra; e++) {
      const claimedReward = await this.typedApi.query.Staking.ClaimedRewards.getValue(e, stash)
      if (claimedReward && claimedReward.length > 0) {
        claimed.push(e)
      }
    }

    return claimed
  }

  // Get all validators
  async getAllValidators(): Promise<string[]> {
    const validators = await this.typedApi.query.Staking.Validators.getEntries()
    return validators.map((v: any) => v.keyArgs[0])
  }

  // Get active validators for current era
  async getActiveValidators(): Promise<ValidatorInfo[]> {
    const activeEra = (await this.typedApi.query.Staking.ActiveEra.getValue())?.value.index || 0
    const validators = await this.typedApi.query.Staking.ErasStakersOverview.getEntries(activeEra)

    const validatorInfos = await Promise.all(
      validators.map(async (v: any) => {
        const address = v.keyArgs[1]
        return this.getValidatorInfo(address)
      })
    )

    return validatorInfos.filter(v => v !== null) as ValidatorInfo[]
  }

  // Get nominator info
  async getNominatorInfo(address: string): Promise<NominatorInfo | null> {
    const nomination = await this.typedApi.query.Staking.Nominators.getValue(address)

    if (!nomination) return null

    return {
      address,
      targets: nomination.targets,
      submittedIn: nomination.submittedIn
    }
  }

  // Watch validator changes (observable)
  watchValidator(address: string, callback: (info: ValidatorInfo | null) => void) {
    const activeEra$ = this.typedApi.query.Staking.ActiveEra.watchValue()

    const sub = activeEra$.subscribe(async (activeEra) => {
      const info = await this.getValidatorInfo(address)
      callback(info)
    })

    return () => sub.unsubscribe()
  }

  // Watch era changes
  watchEraInfo(callback: (info: EraInfo) => void) {
    const currentEra$ = this.typedApi.query.Staking.CurrentEra.watchValue()

    const sub = currentEra$.subscribe(async () => {
      const info = await this.getEraInfo()
      callback(info)
    })

    return () => sub.unsubscribe()
  }

  // Get minimum bond amounts
  async getMinimumAmounts() {
    const [minNominatorBond, minValidatorBond, minActiveStake] = await Promise.all([
      this.typedApi.query.Staking.MinNominatorBond.getValue(),
      this.typedApi.query.Staking.MinValidatorBond.getValue(),
      this.typedApi.query.Staking.MinimumActiveStake.getValue()
    ])

    return {
      minNominatorBond,
      minValidatorBond,
      minActiveStake
    }
  }

  // Get slash info
  async getSlashInfo(era: number) {
    const slashes = await this.typedApi.query.Staking.UnappliedSlashes.getValue(era)
    return slashes || []
  }
}