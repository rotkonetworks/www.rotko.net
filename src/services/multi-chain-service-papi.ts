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

export interface ProxyDefinition {
  delegate: string
  proxyType: string
  delay: number
}

export interface ValidatorEntry {
  address: string
  identity?: string
  commission: number
  totalStake: bigint
  ownStake: bigint
  nominatorCount: number
  isActive: boolean
  isOversubscribed: boolean
  isBlocked: boolean
}

export interface EraInfo {
  currentEra: number
  activeEra: number
  eraProgress: number
  sessionProgress: number
  eraLength: number
  sessionLength: number
}

export interface AccountRelationship {
  type: 'sub-identity' | 'parent-identity' | 'has-proxy' | 'proxy-for'
  relatedAddress: string
  details: string
}

export interface DiscoveredAccount {
  address: string
  source: 'seed' | 'discovered'
  identityName?: string
  relationships: AccountRelationship[]
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

      // First, determine if this address is a stash or controller
      // Bonded maps stash -> controller address
      const controllerAddress = await api.query.Staking.Bonded.getValue(address)

      // Ledger maps controller -> ledger data
      const ledgerFromAddress = await api.query.Staking.Ledger.getValue(address)

      let stashAddress: string
      let controllerAddr: string | undefined
      let ledger: any

      // Determine the stash and get the ledger
      if (controllerAddress) {
        // Address is a stash
        stashAddress = address
        controllerAddr = controllerAddress.toString()
        ledger = await api.query.Staking.Ledger.getValue(controllerAddr)
        console.log(`[getStakingInfo] ${address.slice(0, 8)}... is a STASH, controller: ${controllerAddr.slice(0, 8)}...`)
      } else if (ledgerFromAddress) {
        // Address is a controller
        ledger = ledgerFromAddress
        stashAddress = ledger.stash.toString()
        controllerAddr = address
        console.log(`[getStakingInfo] ${address.slice(0, 8)}... is a CONTROLLER, stash: ${stashAddress.slice(0, 8)}...`)
      } else {
        // Not involved in staking
        console.log(`[getStakingInfo] ${address.slice(0, 8)}... has no bonding`)
        return null
      }

      // Now query staking info using the stash address
      const [payee, nominators, validators, activeEra, currentSession] = await Promise.all([
        api.query.Staking.Payee.getValue(stashAddress),
        api.query.Staking.Nominators.getValue(stashAddress),
        api.query.Staking.Validators.getValue(stashAddress),
        api.query.Staking.ActiveEra.getValue(),
        api.query.Session?.CurrentIndex?.getValue()
      ])

      const unlocking = ledger?.unlocking?.map((unlock: any) => ({
        value: unlock.value,
        era: unlock.era
      })) || []

      // Get unclaimed eras
      const unclaimedEras = await this.getUnclaimedEras(controllerAddr || stashAddress, stashAddress)

      // Parse reward destination
      let rewardDestination = 'Staked'
      if (payee) {
        if (typeof payee === 'object') {
          if ('type' in payee) {
            if (payee.type === 'Account') {
              rewardDestination = `Account: ${payee.value.slice(0, 8)}...`
            } else {
              rewardDestination = payee.type
            }
          } else if ('tag' in payee) {
            rewardDestination = payee.tag === 'Account' ? `Account: ${payee.value.slice(0, 8)}...` : payee.tag
          }
        } else {
          rewardDestination = payee.toString()
        }
      }

      return {
        bonded: ledger?.total || 0n,
        active: ledger?.active || 0n,
        unlocking,
        rewardDestination,
        nominators: nominators?.targets?.map((n: any) => n.toString()),
        validators: validators ? [stashAddress] : undefined,
        commission: validators?.commission,
        era: activeEra?.index,
        sessionIndex: currentSession,
        unclaimedEras
      }
    } catch (error) {
      console.error('Failed to get staking info:', error)
      console.error('Error details:', error)
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

  // Get parent identity (SuperOf) - returns the parent address and sub-name if this is a sub-identity
  async getSuperOf(address: string): Promise<{ parent: string; subName: string } | null> {
    const client = this.clients.peopleChain
    if (!client) return null

    try {
      const api = await client.getUnsafeApi()

      if (!api.query.Identity?.SuperOf) {
        console.warn('SuperOf query not available on People Chain')
        return null
      }

      const superOf = await api.query.Identity.SuperOf.getValue(address)
      if (!superOf) return null

      const [parentAddress, subNameRaw] = superOf
      let subName = ''

      // Decode the sub-name from Raw data
      if (subNameRaw) {
        if (subNameRaw.type === 'Raw' && subNameRaw.value) {
          subName = new TextDecoder().decode(subNameRaw.value)
        } else if (typeof subNameRaw === 'string') {
          subName = subNameRaw
        }
      }

      return {
        parent: parentAddress.toString(),
        subName
      }
    } catch (error) {
      console.error('Failed to get superOf:', error)
      return null
    }
  }

  // Get all sub-identities (SubsOf) - returns list of sub-accounts for an identity
  async getSubsOf(address: string): Promise<{ deposit: bigint; subs: string[] } | null> {
    const client = this.clients.peopleChain
    if (!client) return null

    try {
      const api = await client.getUnsafeApi()

      if (!api.query.Identity?.SubsOf) {
        console.warn('SubsOf query not available on People Chain')
        return null
      }

      const subsOf = await api.query.Identity.SubsOf.getValue(address)
      if (!subsOf) return null

      const [deposit, subs] = subsOf

      return {
        deposit: BigInt(deposit?.toString() || '0'),
        subs: subs?.map((s: any) => s.toString()) || []
      }
    } catch (error) {
      console.error('Failed to get subsOf:', error)
      return null
    }
  }

  // Discover all related accounts through identity hierarchy and proxy relationships
  async discoverRelatedAccounts(seedAddress: string): Promise<DiscoveredAccount[]> {
    const discovered: Map<string, DiscoveredAccount> = new Map()
    const toProcess: string[] = [seedAddress]
    const processed: Set<string> = new Set()

    console.log(`[discoverRelatedAccounts] Starting discovery from ${seedAddress.slice(0, 8)}...`)

    while (toProcess.length > 0) {
      const address = toProcess.pop()!
      if (processed.has(address)) continue
      processed.add(address)

      console.log(`[discoverRelatedAccounts] Processing ${address.slice(0, 8)}...`)

      // Add this address if not already discovered
      if (!discovered.has(address)) {
        discovered.set(address, {
          address,
          source: address === seedAddress ? 'seed' : 'discovered',
          relationships: []
        })
      }

      // 1. Check if this is a sub-identity (has parent)
      const superOf = await this.getSuperOf(address)
      if (superOf) {
        console.log(`[discoverRelatedAccounts] ${address.slice(0, 8)}... has parent ${superOf.parent.slice(0, 8)}...`)

        discovered.get(address)!.relationships.push({
          type: 'sub-identity',
          relatedAddress: superOf.parent,
          details: `Sub-identity "${superOf.subName}" of parent`
        })

        if (!processed.has(superOf.parent)) {
          toProcess.push(superOf.parent)
        }
      }

      // 2. Check for sub-identities (children)
      const subsOf = await this.getSubsOf(address)
      if (subsOf && subsOf.subs.length > 0) {
        console.log(`[discoverRelatedAccounts] ${address.slice(0, 8)}... has ${subsOf.subs.length} sub-identities`)

        for (const sub of subsOf.subs) {
          discovered.get(address)!.relationships.push({
            type: 'parent-identity',
            relatedAddress: sub,
            details: 'Parent of sub-identity'
          })

          if (!processed.has(sub)) {
            toProcess.push(sub)
          }
        }
      }

      // 3. Check for proxies (accounts this address can control)
      const proxies = await this.getProxies(address)
      for (const proxy of proxies) {
        console.log(`[discoverRelatedAccounts] ${address.slice(0, 8)}... has proxy ${proxy.delegate.slice(0, 8)}... (${proxy.proxyType})`)

        discovered.get(address)!.relationships.push({
          type: 'has-proxy',
          relatedAddress: proxy.delegate,
          details: `${proxy.proxyType} proxy${proxy.delay > 0 ? ` (${proxy.delay} block delay)` : ''}`
        })
      }

      // 4. Check if this address is a proxy for others (reverse lookup)
      // This requires checking all known addresses, so we only check already discovered ones
      for (const [knownAddress] of discovered) {
        if (knownAddress === address) continue

        const theirProxies = await this.getProxies(knownAddress)
        const isProxyFor = theirProxies.find(p => p.delegate === address)

        if (isProxyFor) {
          console.log(`[discoverRelatedAccounts] ${address.slice(0, 8)}... is proxy for ${knownAddress.slice(0, 8)}...`)

          const existing = discovered.get(address)!.relationships.find(
            r => r.type === 'proxy-for' && r.relatedAddress === knownAddress
          )

          if (!existing) {
            discovered.get(address)!.relationships.push({
              type: 'proxy-for',
              relatedAddress: knownAddress,
              details: `${isProxyFor.proxyType} proxy for this account`
            })
          }
        }
      }

      // 5. Get identity display name if available
      const identity = await this.getIdentity(address)
      if (identity?.display) {
        let displayName = ''
        if (identity.display.type === 'Raw' && identity.display.value) {
          displayName = new TextDecoder().decode(identity.display.value)
        }
        if (displayName) {
          discovered.get(address)!.identityName = displayName
        }
      }
    }

    console.log(`[discoverRelatedAccounts] Discovered ${discovered.size} related accounts`)
    return Array.from(discovered.values())
  }

  // Execute staking operations using the new API
  // Note: controller is deprecated in modern Substrate, use stash as controller
  async bond(signer: any, controllerAddress: string, amount: bigint, payee: string) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[bond] Bonding ${amount} with controller=${controllerAddress}, payee=${payee}`)

    try {
      const api = await client.getUnsafeApi()

      // Format payee based on the type
      let formattedPayee: any
      if (payee === 'Staked') {
        formattedPayee = { type: 'Staked' }
      } else if (payee === 'Stash') {
        formattedPayee = { type: 'Stash' }
      } else if (payee === 'Controller') {
        formattedPayee = { type: 'Controller' }
      } else {
        // Account address
        formattedPayee = { type: 'Account', value: payee }
      }

      console.log('[bond] Formatted payee:', formattedPayee)

      // UnsafeApi transactions need object format for parameters
      // Modern runtimes may not need controller (it's deprecated)
      const tx = api.tx.Staking.bond({
        value: amount,
        payee: formattedPayee
      })

      const signedTx = await tx.sign(signer, {})
      console.log('[bond] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[bond] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[bond] Transaction failed:', error)
      throw error
    }
  }

  async unbond(signer: any, amount: bigint) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[unbond] Unbonding ${amount}`)

    try {
      // Note: getUnsafeApi() returns offline transactions without signAndSubmit
      // We need to sign and submit manually
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.unbond({value: amount})

      // Sign the transaction
      const signedTx = await tx.sign(signer, {})
      console.log('[unbond] Transaction signed, submitting...')

      // Submit the signed transaction
      const result = await client.submit(signedTx)
      console.log('[unbond] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[unbond] Transaction failed:', error)
      throw error
    }
  }

  async nominate(signer: any, targets: string[]) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[nominate] Nominating ${targets.length} validators:`, targets.map(t => t.slice(0, 8) + '...'))

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.nominate({targets})

      const signedTx = await tx.sign(signer, {})
      console.log('[nominate] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[nominate] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[nominate] Transaction failed:', error)
      throw error
    }
  }

  async chill(signer: any) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log('[chill] Chilling account')

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.chill({})

      const signedTx = await tx.sign(signer, {})
      console.log('[chill] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[chill] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[chill] Transaction failed:', error)
      throw error
    }
  }

  async setKeys(signer: any, keys: string, proof: string) {
    // Session keys are always on relay chain
    const client = this.clients.relay
    if (!client) throw new Error('Not connected to relay chain')

    console.log(`[setKeys] Setting session keys: ${keys.slice(0, 16)}...`)

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Session.setKeys({keys, proof})

      const signedTx = await tx.sign(signer, {})
      console.log('[setKeys] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[setKeys] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[setKeys] Transaction failed:', error)
      throw error
    }
  }

  async withdrawUnbonded(signer: any, numSlashingSpans: number) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[withdrawUnbonded] Withdrawing unbonded with ${numSlashingSpans} slashing spans`)

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.withdrawUnbonded({num_slashing_spans: numSlashingSpans})

      const signedTx = await tx.sign(signer, {})
      console.log('[withdrawUnbonded] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[withdrawUnbonded] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[withdrawUnbonded] Transaction failed:', error)
      throw error
    }
  }

  async payoutStakers(signer: any, validatorStash: string, era: number) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[payoutStakers] Paying out stakers for validator ${validatorStash.slice(0, 8)}... era ${era}`)

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.payoutStakers({validator_stash: validatorStash, era})

      const signedTx = await tx.sign(signer, {})
      console.log('[payoutStakers] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[payoutStakers] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[payoutStakers] Transaction failed:', error)
      throw error
    }
  }

  // Add rebond method
  async rebond(signer: any, amount: bigint) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[rebond] Rebonding ${amount}`)

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.rebond({value: amount})

      const signedTx = await tx.sign(signer, {})
      console.log('[rebond] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[rebond] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[rebond] Transaction failed:', error)
      throw error
    }
  }

  // Add validate method
  async validate(signer: any, prefs: {commission: number, blocked: boolean}) {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) throw new Error('Not connected to staking chain')

    console.log(`[validate] Starting validation with commission=${prefs.commission}, blocked=${prefs.blocked}`)

    try {
      const api = await client.getUnsafeApi()
      const tx = api.tx.Staking.validate({prefs})

      const signedTx = await tx.sign(signer, {})
      console.log('[validate] Transaction signed, submitting...')

      const result = await client.submit(signedTx)
      console.log('[validate] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[validate] Transaction failed:', error)
      throw error
    }
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

  // Get proxies for an address
  async getProxies(address: string): Promise<ProxyDefinition[]> {
    const client = this.clients.relay
    if (!client) return []

    try {
      const api = await client.getUnsafeApi()
      const proxiesData = await api.query.Proxy?.Proxies?.getValue(address)

      if (!proxiesData || !proxiesData[0]) return []

      return proxiesData[0].map((proxy: any) => ({
        delegate: proxy.delegate?.toString() || '',
        proxyType: proxy.proxyType?.toString() || proxy.proxy_type?.toString() || 'Unknown',
        delay: Number(proxy.delay || 0)
      }))
    } catch (error) {
      console.error('Failed to get proxies:', error)
      return []
    }
  }

  // Validate proxy access - check if proxyAddress has proxy access to any of the delegator addresses
  async validateProxyAccess(
    proxyAddress: string,
    delegatorAddresses: string[]
  ): Promise<ProxyDefinition | null> {
    for (const delegator of delegatorAddresses) {
      const proxies = await this.getProxies(delegator)
      const proxyDef = proxies.find(p => p.delegate === proxyAddress)
      if (proxyDef) {
        return proxyDef
      }
    }
    return null
  }

  // Get current era information
  async getEraInfo(): Promise<EraInfo | null> {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) return null

    try {
      const api = await client.getUnsafeApi()

      const [activeEra, currentEra] = await Promise.all([
        api.query.Staking?.ActiveEra?.getValue(),
        api.query.Staking?.CurrentEra?.getValue()
      ])

      // Try to get session info for progress calculation
      let eraProgress = 0
      let sessionProgress = 0
      let eraLength = 0
      let sessionLength = 0

      try {
        const currentIndex = await api.query.Session?.CurrentIndex?.getValue()
        const epochIndex = await api.query.Babe?.EpochIndex?.getValue()

        // Get constants
        const epochDuration = 2400 // blocks per epoch/session
        const sessionsPerEra = 6

        eraLength = epochDuration * sessionsPerEra
        sessionLength = epochDuration

        // Calculate progress (simplified)
        if (currentIndex) {
          const sessionInEra = Number(currentIndex) % sessionsPerEra
          sessionProgress = (sessionInEra / sessionsPerEra) * 100
          eraProgress = sessionProgress // Simplified - would need block info for accurate
        }
      } catch (e) {
        console.warn('Could not get session progress:', e)
      }

      return {
        currentEra: currentEra || 0,
        activeEra: activeEra?.index || 0,
        eraProgress,
        sessionProgress,
        eraLength,
        sessionLength
      }
    } catch (error) {
      console.error('Failed to get era info:', error)
      return null
    }
  }

  // Get list of validators with their info
  async getValidators(): Promise<ValidatorEntry[]> {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub

    if (!client) return []

    try {
      const api = await client.getUnsafeApi()

      // Get active era
      const activeEra = await api.query.Staking?.ActiveEra?.getValue()
      const currentEra = activeEra?.index || 0

      // Get all validators
      const validatorEntries = await api.query.Staking?.Validators?.getEntries()
      if (!validatorEntries) return []

      // Get active validator set
      const activeValidators = await api.query.Session?.Validators?.getValue() || []
      const activeSet = new Set(activeValidators.map((v: any) => v.toString()))

      // Get max nominators per validator
      const maxNominators = await api.query.Staking?.MaxNominatorsCount?.getValue() || 256

      const validators: ValidatorEntry[] = []

      for (const entry of validatorEntries) {
        const address = entry.keyArgs[0]?.toString()
        const prefs = entry.value

        if (!address) continue

        // Get exposure for this validator in current era
        let totalStake = 0n
        let ownStake = 0n
        let nominatorCount = 0

        try {
          const exposure = await api.query.Staking?.ErasStakers?.getValue(currentEra, address)
          if (exposure) {
            totalStake = BigInt(exposure.total?.toString() || '0')
            ownStake = BigInt(exposure.own?.toString() || '0')
            nominatorCount = exposure.others?.length || 0
          }
        } catch (e) {
          // Exposure might not exist for waiting validators
        }

        // Try to get identity from people chain
        let identity: string | undefined
        if (this.clients.peopleChain) {
          try {
            const peopleApi = await this.clients.peopleChain.getUnsafeApi()
            const identityInfo = await peopleApi.query.Identity?.IdentityOf?.getValue(address)
            if (identityInfo && identityInfo[0]?.info?.display) {
              const display = identityInfo[0].info.display
              if (display.type === 'Raw' && display.value) {
                identity = new TextDecoder().decode(display.value)
              }
            }
          } catch (e) {
            // Identity lookup failed, continue without it
          }
        }

        validators.push({
          address,
          identity,
          commission: (prefs.commission || 0) / 10000000,
          totalStake,
          ownStake,
          nominatorCount,
          isActive: activeSet.has(address),
          isOversubscribed: nominatorCount >= Number(maxNominators),
          isBlocked: prefs.blocked || false
        })
      }

      // Sort by total stake descending
      validators.sort((a, b) => Number(b.totalStake - a.totalStake))

      return validators
    } catch (error) {
      console.error('Failed to get validators:', error)
      return []
    }
  }

  // Generic proxy execution - wraps any transaction in a proxy call
  // Usage: await executeViaProxy(signer, realAccount, innerTx, 'Staking')
  async executeViaProxy(
    signer: any,
    realAccount: string,
    innerTx: any,
    proxyType: string = 'Staking',
    client?: any
  ) {
    const targetClient = client || (this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub)

    if (!targetClient) throw new Error('Not connected')

    console.log(`[executeViaProxy] Executing call for ${realAccount.slice(0, 8)}... via ${proxyType} proxy`)

    try {
      const api = await targetClient.getUnsafeApi()

      const proxyCall = api.tx.Proxy.proxy({
        real: realAccount,
        force_proxy_type: { type: proxyType },
        call: innerTx.decodedCall
      })

      const signedTx = await proxyCall.sign(signer, {})
      console.log('[executeViaProxy] Transaction signed, submitting...')

      const result = await targetClient.submit(signedTx)
      console.log('[executeViaProxy] Transaction submitted successfully:', result)
      return result
    } catch (error) {
      console.error('[executeViaProxy] Transaction failed:', error)
      throw error
    }
  }

  // Helper to get the staking API for building transactions
  async getStakingApi() {
    const client = this.config?.stakingLocation === 'relay'
      ? this.clients.relay
      : this.clients.assetHub
    if (!client) throw new Error('Not connected to staking chain')
    return client.getUnsafeApi()
  }

  // Helper to get relay API (for session keys)
  async getRelayApi() {
    if (!this.clients.relay) throw new Error('Not connected to relay chain')
    return this.clients.relay.getUnsafeApi()
  }

  // Get accounts that this address can proxy for
  async getProxiedAccounts(proxyAddress: string, knownAddresses: string[]): Promise<{
    account: string
    proxyType: string
    delay: number
  }[]> {
    const proxiedAccounts: { account: string; proxyType: string; delay: number }[] = []

    for (const address of knownAddresses) {
      const proxies = await this.getProxies(address)
      const match = proxies.find(p => p.delegate === proxyAddress)

      if (match) {
        proxiedAccounts.push({
          account: address,
          proxyType: match.proxyType,
          delay: match.delay
        })
      }
    }

    return proxiedAccounts
  }
}

// Singleton instance
export const multiChainServicePapi = new MultiChainServicePapi()