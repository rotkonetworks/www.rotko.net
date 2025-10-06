import { ApiPromise, WsProvider } from '@polkadot/api'
import type { ChainId, ChainConfig } from '../types/polkadot'

export interface ChainConnections {
  relay?: ApiPromise
  assetHub?: ApiPromise
  peopleChain?: ApiPromise
}

export interface ConnectionStatus {
  relay: boolean
  assetHub: boolean
  peopleChain: boolean
}

export interface AccountBalance {
  free: string
  reserved: string
  frozen: string
  flags: string
}

export interface StakingData {
  bonded: string
  active: string
  unlocking: Array<{ value: string; era: number }>
  rewardDestination: string
  nominators?: string[]
  validators?: string[]
  commission?: number
  era?: number
  sessionIndex?: number
}

export class MultiChainService {
  private connections: ChainConnections = {}
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = []
  private currentChain?: ChainId
  private config?: ChainConfig

  constructor() {}

  // Subscribe to connection status changes
  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusCallbacks.push(callback)
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback)
    }
  }

  private notifyStatus() {
    const status: ConnectionStatus = {
      relay: !!this.connections.relay?.isConnected,
      assetHub: !!this.connections.assetHub?.isConnected,
      peopleChain: !!this.connections.peopleChain?.isConnected
    }
    this.statusCallbacks.forEach(cb => cb(status))
  }

  async connect(chainId: ChainId, config: ChainConfig) {
    this.currentChain = chainId
    this.config = config

    // Disconnect existing connections
    await this.disconnect()

    // Connect to relay chain
    try {
      const relayProvider = new WsProvider(config.relay)
      this.connections.relay = await ApiPromise.create({ provider: relayProvider })
      console.log(`Connected to ${config.name} relay chain`)
      this.notifyStatus()
    } catch (error) {
      console.error('Failed to connect to relay chain:', error)
    }

    // Connect to Asset Hub
    try {
      const assetProvider = new WsProvider(config.assetHub)
      this.connections.assetHub = await ApiPromise.create({ provider: assetProvider })
      console.log(`Connected to ${config.name} Asset Hub`)
      this.notifyStatus()
    } catch (error) {
      console.error('Failed to connect to Asset Hub:', error)
    }

    // Connect to People Chain
    try {
      const peopleProvider = new WsProvider(config.peopleChain)
      this.connections.peopleChain = await ApiPromise.create({ provider: peopleProvider })
      console.log(`Connected to ${config.name} People Chain`)
      this.notifyStatus()
    } catch (error) {
      console.error('Failed to connect to People Chain:', error)
    }
  }

  async disconnect() {
    if (this.connections.relay) {
      await this.connections.relay.disconnect()
      this.connections.relay = undefined
    }
    if (this.connections.assetHub) {
      await this.connections.assetHub.disconnect()
      this.connections.assetHub = undefined
    }
    if (this.connections.peopleChain) {
      await this.connections.peopleChain.disconnect()
      this.connections.peopleChain = undefined
    }
    this.notifyStatus()
  }

  // Get account balance from appropriate chain
  async getBalance(address: string): Promise<AccountBalance | null> {
    const api = this.connections.relay || this.connections.assetHub
    if (!api) return null

    try {
      const account = await api.query.system.account(address)
      const data = account.data as any

      return {
        free: data.free.toString(),
        reserved: data.reserved.toString(),
        frozen: data.frozen?.toString() || data.miscFrozen?.toString() || '0',
        flags: data.flags?.toString() || '0'
      }
    } catch (error) {
      console.error('Failed to get balance:', error)
      return null
    }
  }

  // Get staking info from appropriate chain
  async getStakingInfo(address: string): Promise<StakingData | null> {
    // Determine which chain has staking based on config
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) return null

    try {
      const [bonded, ledger, payee, nominators, validators, activeEra, currentSession] = await Promise.all([
        api.query.staking?.bonded(address),
        api.query.staking?.ledger(address),
        api.query.staking?.payee(address),
        api.query.staking?.nominators(address),
        api.query.staking?.validators(address),
        api.query.staking?.activeEra(),
        api.query.session?.currentIndex()
      ])

      const ledgerData = ledger?.unwrapOr(null)
      const bondedAmount = bonded?.unwrapOr(null)?.toString() || '0'

      const unlocking = ledgerData?.unlocking?.map((unlock: any) => ({
        value: unlock.value.toString(),
        era: unlock.era.toNumber()
      })) || []

      const nominatorData = nominators?.unwrapOr(null)
      const validatorData = validators?.unwrapOr(null)

      return {
        bonded: bondedAmount,
        active: ledgerData?.active?.toString() || '0',
        unlocking,
        rewardDestination: payee?.toString() || 'Staked',
        nominators: nominatorData?.targets?.map((n: any) => n.toString()),
        validators: validatorData ? [address] : undefined,
        commission: validatorData?.commission?.toNumber(),
        era: activeEra?.unwrapOr(null)?.index?.toNumber(),
        sessionIndex: currentSession?.toNumber()
      }
    } catch (error) {
      console.error('Failed to get staking info:', error)
      return null
    }
  }

  // Get identity from People Chain
  async getIdentity(address: string): Promise<any | null> {
    const api = this.connections.peopleChain
    if (!api) return null

    try {
      const identity = await api.query.identity?.identityOf(address)
      if (!identity || identity.isEmpty) return null

      const info = identity.unwrap()[0]
      return {
        display: info.display.asRaw.toHuman(),
        legal: info.legal.asRaw.toHuman(),
        web: info.web.asRaw.toHuman(),
        email: info.email.asRaw.toHuman(),
        twitter: info.twitter.asRaw.toHuman()
      }
    } catch (error) {
      console.error('Failed to get identity:', error)
      return null
    }
  }

  // Execute staking operations
  async bond(signer: any, controllerAddress: string, amount: string, payee: string) {
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) throw new Error('Not connected to staking chain')

    const tx = api.tx.staking.bond(controllerAddress, amount, payee)
    return await tx.signAndSend(signer)
  }

  async unbond(signer: any, amount: string) {
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) throw new Error('Not connected to staking chain')

    const tx = api.tx.staking.unbond(amount)
    return await tx.signAndSend(signer)
  }

  async nominate(signer: any, targets: string[]) {
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) throw new Error('Not connected to staking chain')

    const tx = api.tx.staking.nominate(targets)
    return await tx.signAndSend(signer)
  }

  async chill(signer: any) {
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) throw new Error('Not connected to staking chain')

    const tx = api.tx.staking.chill()
    return await tx.signAndSend(signer)
  }

  async setKeys(signer: any, keys: string, proof: string) {
    // Session keys are always on relay chain
    const api = this.connections.relay
    if (!api) throw new Error('Not connected to relay chain')

    const tx = api.tx.session.setKeys(keys, proof)
    return await tx.signAndSend(signer)
  }

  async withdrawUnbonded(signer: any, numSlashingSpans: number) {
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) throw new Error('Not connected to staking chain')

    const tx = api.tx.staking.withdrawUnbonded(numSlashingSpans)
    return await tx.signAndSend(signer)
  }

  async payoutStakers(signer: any, validatorStash: string, era: number) {
    const api = this.config?.stakingLocation === 'relay'
      ? this.connections.relay
      : this.connections.assetHub

    if (!api) throw new Error('Not connected to staking chain')

    const tx = api.tx.staking.payoutStakers(validatorStash, era)
    return await tx.signAndSend(signer)
  }

  // Get all connections
  getConnections(): ChainConnections {
    return this.connections
  }

  // Check if connected
  isConnected(): boolean {
    return !!(this.connections.relay?.isConnected ||
             this.connections.assetHub?.isConnected ||
             this.connections.peopleChain?.isConnected)
  }
}

// Singleton instance
export const multiChainService = new MultiChainService()