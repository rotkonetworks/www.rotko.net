import { createClient, type PolkadotClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import { getSmProvider } from 'polkadot-api/sm-provider'
import { startFromWorker } from 'polkadot-api/smoldot/from-worker'
import type { ChainId, ChainConfig } from '../types/polkadot'

export interface ChainClients {
  relay?: PolkadotClient
  assetHub?: PolkadotClient
  peopleChain?: PolkadotClient
}

export interface ConnectionStatus {
  relay: boolean
  assetHub: boolean
  peopleChain: boolean
}

export interface AccountBalance {
  free: bigint
  reserved: bigint
  frozen: bigint
  flags: bigint
}

export interface StakingData {
  bonded: bigint
  active: bigint
  unlocking: Array<{ value: bigint; era: number }>
  rewardDestination: string
  nominators?: string[]
  validators?: string[]
  commission?: number
  era?: number
  sessionIndex?: number
  unclaimedEras?: number[]
}

export class MultiChainServicePapi {
  private clients: ChainClients = {}
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
      relay: !!this.clients.relay,
      assetHub: !!this.clients.assetHub,
      peopleChain: !!this.clients.peopleChain
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
      const relayProvider = getWsProvider(config.relay)
      this.clients.relay = createClient(relayProvider)
      console.log(`Connected to ${config.name} relay chain`)
      this.notifyStatus()
    } catch (error) {
      console.error('Failed to connect to relay chain:', error)
    }

    // Connect to Asset Hub
    try {
      const assetProvider = getWsProvider(config.assetHub)
      this.clients.assetHub = createClient(assetProvider)
      console.log(`Connected to ${config.name} Asset Hub`)
      this.notifyStatus()
    } catch (error) {
      console.error('Failed to connect to Asset Hub:', error)
    }

    // Connect to People Chain
    try {
      const peopleProvider = getWsProvider(config.peopleChain)
      this.clients.peopleChain = createClient(peopleProvider)
      console.log(`Connected to ${config.name} People Chain`)
      this.notifyStatus()
    } catch (error) {
      console.error('Failed to connect to People Chain:', error)
    }
  }

  async disconnect() {
    if (this.clients.relay) {
      this.clients.relay.destroy()
      this.clients.relay = undefined
    }
    if (this.clients.assetHub) {
      this.clients.assetHub.destroy()
      this.clients.assetHub = undefined
    }
    if (this.clients.peopleChain) {
      this.clients.peopleChain.destroy()
      this.clients.peopleChain = undefined
    }
    this.notifyStatus()
  }

  // Get account balance from appropriate chain
  async getBalance(address: string): Promise<AccountBalance | null> {
    const client = this.clients.relay || this.clients.assetHub
    if (!client) return null

    try {
      // Use the new polkadot-api typed API
      const api = await client.getUnsafeApi()
      const account = await api.query.System.Account.getValue(address)

      return {
        free: account.data.free,
        reserved: account.data.reserved,
        frozen: account.data.frozen || account.data.miscFrozen || 0n,
        flags: account.data.flags || 0n
      }
    } catch (error) {
      console.error('Failed to get balance:', error)
      return null
    }
  }

  // Get staking info from appropriate chain
  async getStakingInfo(address: string): Promise<StakingData | null> {
    // Determine which chain has staking based on config
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) return null

    try {
      const api = await client.getUnsafeApi()

      // Check if staking pallet exists
      if (!api.query.Staking) {
        console.warn('Staking pallet not available on this chain')
        return null
      }

      const [bonded, ledger, payee, nominators, validators, activeEra, currentSession] = await Promise.all([
        api.query.Staking.Bonded.getValue(address),
        api.query.Staking.Ledger.getValue(address),
        api.query.Staking.Payee.getValue(address),
        api.query.Staking.Nominators.getValue(address),
        api.query.Staking.Validators.getValue(address),
        api.query.Staking.ActiveEra.getValue(),
        api.query.Session?.CurrentIndex?.getValue()
      ])

      const unlocking = ledger?.unlocking?.map((unlock: any) => ({
        value: unlock.value,
        era: unlock.era
      })) || []

      // Get unclaimed eras
      const unclaimedEras = await this.getUnclaimedEras(address, ledger?.stash || address)

      return {
        bonded: bonded || 0n,
        active: ledger?.active || 0n,
        unlocking,
        rewardDestination: payee || 'Staked',
        nominators: nominators?.targets?.map((n: any) => n.toString()),
        validators: validators ? [address] : undefined,
        commission: validators?.commission,
        era: activeEra?.index,
        sessionIndex: currentSession,
        unclaimedEras
      }
    } catch (error) {
      console.error('Failed to get staking info:', error)
      return null
    }
  }

  // Get unclaimed eras for an account
  async getUnclaimedEras(controller: string, stash: string): Promise<number[]> {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) return []

    try {
      const api = await client.getUnsafeApi()

      // Check if staking pallet exists
      if (!api.query.Staking) {
        return []
      }

      const activeEra = await api.query.Staking.ActiveEra.getValue()
      if (!activeEra) return []

      const currentEra = activeEra.index
      const historyDepth = await api.query.Staking.HistoryDepth.getValue()

      // Calculate the range of eras to check (last 84 eras by default)
      const maxClaimableEras = Number(historyDepth || 84)
      const startEra = Math.max(0, currentEra - maxClaimableEras)

      const unclaimedEras: number[] = []

      // Check each era for unclaimed rewards
      for (let era = currentEra - 1; era >= startEra; era--) {
        try {
          // Check if the validator/nominator was active in this era
          const exposure = await api.query.Staking.ErasStakers?.getValue(era, stash)
          const nominatorExposure = await api.query.Staking.ErasStakersClipped?.getValue(era, stash)

          if (exposure || nominatorExposure) {
            // Check if rewards have been claimed for this era
            const claimed = await api.query.Staking.Ledger.getValue(controller)
            const claimedEras = claimed?.claimedRewards || []

            if (!claimedEras.includes(era)) {
              // Also check the new ClaimedRewards storage if available
              const rewardsClaimed = await api.query.Staking.ClaimedRewards?.getValue(era, stash)

              if (!rewardsClaimed) {
                unclaimedEras.push(era)
              }
            }
          }
        } catch (err) {
          // Continue checking other eras even if one fails
          console.warn(`Failed to check era ${era}:`, err)
        }
      }

      return unclaimedEras.sort((a, b) => b - a) // Return in descending order
    } catch (error) {
      console.error('Failed to get unclaimed eras:', error)
      return []
    }
  }

  // Get identity from People Chain
  async getIdentity(address: string): Promise<any | null> {
    const client = this.clients.peopleChain
    if (!client) return null

    try {
      const api = await client.getUnsafeApi()

      // Check if identity pallet exists
      if (!api.query.Identity) {
        console.warn('Identity pallet not available on People Chain')
        return null
      }

      const identity = await api.query.Identity.IdentityOf.getValue(address)
      if (!identity) return null

      const info = identity[0]
      return {
        display: info.display,
        legal: info.legal,
        web: info.web,
        email: info.email,
        twitter: info.twitter
      }
    } catch (error) {
      console.error('Failed to get identity:', error)
      return null
    }
  }

  // Execute staking operations using the new API
  async bond(signer: any, controllerAddress: string, amount: bigint, payee: string) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Staking.bond({
      controller: controllerAddress,
      value: amount,
      payee
    })

    // Sign and submit transaction
    return await tx.signAndSubmit(signer)
  }

  async unbond(signer: any, amount: bigint) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Staking.unbond({ value: amount })
    return await tx.signAndSubmit(signer)
  }

  async nominate(signer: any, targets: string[]) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Staking.nominate({ targets })
    return await tx.signAndSubmit(signer)
  }

  async chill(signer: any) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Staking.chill()
    return await tx.signAndSubmit(signer)
  }

  async setKeys(signer: any, keys: string, proof: Uint8Array) {
    // Session keys are always on relay chain
    const client = this.clients.relay
    if (!client) throw new Error('Not connected to relay chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Session.setKeys({ keys, proof })
    return await tx.signAndSubmit(signer)
  }

  async withdrawUnbonded(signer: any, numSlashingSpans: number) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Staking.withdrawUnbonded({ num_slashing_spans: numSlashingSpans })
    return await tx.signAndSubmit(signer)
  }

  async payoutStakers(signer: any, validatorStash: string, era: number) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    const api = await client.getUnsafeApi()
    const tx = api.tx.Staking.payoutStakers({
      validator_stash: validatorStash,
      era
    })
    return await tx.signAndSubmit(signer)
  }

  // Get all clients
  getClients(): ChainClients {
    return this.clients
  }

  // Check if connected
  isConnected(): boolean {
    return !!(this.clients.relay || this.clients.assetHub || this.clients.peopleChain)
  }

  // Format balance for display
  formatBalance(balance: bigint, decimals: number): string {
    const divisor = 10n ** BigInt(decimals)
    const wholePart = balance / divisor
    const decimalPart = balance % divisor

    const decimalStr = decimalPart.toString().padStart(decimals, '0')
    const trimmedDecimal = decimalStr.slice(0, 4) // Show 4 decimal places

    return `${wholePart.toLocaleString()}.${trimmedDecimal}`
  }
}

// Singleton instance
export const multiChainServicePapi = new MultiChainServicePapi()