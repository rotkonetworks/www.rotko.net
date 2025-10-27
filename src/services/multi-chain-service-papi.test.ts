/**
 * Test suite for multi-chain PAPI validator controls
 *
 * This file contains comprehensive tests for the validator control queries
 * to ensure correct implementation with polkadot-api
 */

import { multiChainServicePapi } from './multi-chain-service-papi'

/**
 * Test addresses (replace with real test addresses for your chain)
 */
const TEST_ADDRESSES = {
  // Polkadot
  polkadot: {
    validator: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5', // Example validator
    nominator: '14Gm5uMqg93eMXmhwk1f4TdFWbXzF91FTfGKRvP8bXHoiUph', // Example nominator
    stash: '16aP3oTaD7oQ6qmxU6fDAi7NWUB7knqH6UsWbwjnAhvRSxzS', // Example stash
  },
  // Kusama
  kusama: {
    validator: 'EX9uchmfeSqKTM7cMMg8DkH49XV8i4R7a7rqCn8btpZBHDP',
    nominator: 'CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp',
    stash: 'J4sW13h5KZdFmjFCYRqbATpbqnhVNDrW9C1YA5TEJ4jP1hq',
  },
  // Paseo (testnet)
  paseo: {
    validator: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    nominator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    stash: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
  }
}

/**
 * Helper function to format balance for display
 */
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals)
  const wholePart = balance / divisor
  const decimalPart = balance % divisor
  const decimalStr = decimalPart.toString().padStart(decimals, '0')
  const trimmedDecimal = decimalStr.slice(0, 4)
  return `${wholePart.toLocaleString()}.${trimmedDecimal}`
}

/**
 * Test 1: Connect to chains
 */
async function testConnection(chainId: 'polkadot' | 'kusama' | 'paseo') {
  console.log(`\n=== Testing Connection to ${chainId} ===`)

  const configs = {
    polkadot: {
      name: 'Polkadot',
      relay: 'wss://polkadot.dotters.network',
      assetHub: 'wss://asset-hub-polkadot.dotters.network',
      peopleChain: 'wss://people-polkadot.dotters.network',
      stakingLocation: 'relay' as const,
      ss58: 0,
      decimals: 10,
      token: 'DOT'
    },
    kusama: {
      name: 'Kusama',
      relay: 'wss://kusama.dotters.network',
      assetHub: 'wss://asset-hub-kusama.dotters.network',
      peopleChain: 'wss://people-kusama.dotters.network',
      stakingLocation: 'assetHub' as const,
      ss58: 2,
      decimals: 12,
      token: 'KSM'
    },
    paseo: {
      name: 'Paseo Testnet',
      relay: 'wss://paseo.dotters.network',
      assetHub: 'wss://asset-hub-paseo.dotters.network',
      peopleChain: 'wss://people-paseo.dotters.network',
      stakingLocation: 'assetHub' as const,
      ss58: 0,
      decimals: 10,
      token: 'PAS'
    }
  }

  try {
    await multiChainServicePapi.connect(chainId, configs[chainId])
    console.log('✅ Connected successfully')

    // Wait for connections to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000))

    const clients = multiChainServicePapi.getClients()
    console.log('  Relay chain:', clients.relay ? '✅ Connected' : '❌ Not connected')
    console.log('  Asset Hub:', clients.assetHub ? '✅ Connected' : '❌ Not connected')
    console.log('  People Chain:', clients.peopleChain ? '✅ Connected' : '❌ Not connected')

    return true
  } catch (error) {
    console.error('❌ Connection failed:', error)
    return false
  }
}

/**
 * Test 2: Query account balance
 */
async function testGetBalance(address: string, chainId: 'polkadot' | 'kusama' | 'paseo') {
  console.log(`\n=== Testing getBalance for ${address.slice(0, 8)}... ===`)

  const decimals = chainId === 'kusama' ? 12 : 10
  const token = chainId === 'polkadot' ? 'DOT' : chainId === 'kusama' ? 'KSM' : 'PAS'

  try {
    const balance = await multiChainServicePapi.getBalance(address)

    if (balance) {
      console.log('✅ Balance retrieved successfully:')
      console.log(`  Free: ${formatBalance(balance.free, decimals)} ${token}`)
      console.log(`  Reserved: ${formatBalance(balance.reserved, decimals)} ${token}`)
      console.log(`  Frozen: ${formatBalance(balance.frozen, decimals)} ${token}`)
      return true
    } else {
      console.log('⚠️  No balance data returned')
      return false
    }
  } catch (error) {
    console.error('❌ Failed to get balance:', error)
    return false
  }
}

/**
 * Test 3: Query staking info
 */
async function testGetStakingInfo(address: string, chainId: 'polkadot' | 'kusama' | 'paseo') {
  console.log(`\n=== Testing getStakingInfo for ${address.slice(0, 8)}... ===`)

  const decimals = chainId === 'kusama' ? 12 : 10
  const token = chainId === 'polkadot' ? 'DOT' : chainId === 'kusama' ? 'KSM' : 'PAS'

  try {
    const staking = await multiChainServicePapi.getStakingInfo(address)

    if (staking) {
      console.log('✅ Staking info retrieved successfully:')
      console.log(`  Bonded: ${formatBalance(staking.bonded, decimals)} ${token}`)
      console.log(`  Active: ${formatBalance(staking.active, decimals)} ${token}`)
      console.log(`  Unlocking chunks: ${staking.unlocking.length}`)

      if (staking.unlocking.length > 0) {
        console.log('  Unlocking:')
        staking.unlocking.forEach((unlock, i) => {
          console.log(`    [${i}] ${formatBalance(unlock.value, decimals)} ${token} at era ${unlock.era}`)
        })
      }

      console.log(`  Reward destination: ${staking.rewardDestination}`)
      console.log(`  Current era: ${staking.era || 'N/A'}`)
      console.log(`  Session index: ${staking.sessionIndex || 'N/A'}`)

      if (staking.validators) {
        console.log(`  ✅ IS VALIDATOR`)
        console.log(`  Commission: ${staking.commission ? (staking.commission / 10000000).toFixed(2) + '%' : 'N/A'}`)
      }

      if (staking.nominators && staking.nominators.length > 0) {
        console.log(`  ✅ IS NOMINATING ${staking.nominators.length} validators`)
        staking.nominators.slice(0, 3).forEach((nom, i) => {
          console.log(`    [${i}] ${nom.slice(0, 12)}...`)
        })
        if (staking.nominators.length > 3) {
          console.log(`    ... and ${staking.nominators.length - 3} more`)
        }
      }

      if (staking.unclaimedEras && staking.unclaimedEras.length > 0) {
        console.log(`  ⚠️  Unclaimed rewards in ${staking.unclaimedEras.length} eras`)
        console.log(`    Eras: ${staking.unclaimedEras.slice(0, 5).join(', ')}${staking.unclaimedEras.length > 5 ? '...' : ''}`)
      }

      return true
    } else {
      console.log('⚠️  No staking data (account might not be bonded)')
      return false
    }
  } catch (error) {
    console.error('❌ Failed to get staking info:', error)
    console.error('Error details:', error)
    return false
  }
}

/**
 * Test 4: Test stash/controller relationship queries
 */
async function testStashControllerQueries(chainId: 'polkadot' | 'kusama' | 'paseo') {
  console.log(`\n=== Testing Stash/Controller Queries on ${chainId} ===`)

  const clients = multiChainServicePapi.getClients()
  const config = {
    polkadot: { stakingLocation: 'relay' as const },
    kusama: { stakingLocation: 'assetHub' as const },
    paseo: { stakingLocation: 'assetHub' as const }
  }[chainId]

  const client = config.stakingLocation === 'relay' ? clients.relay : clients.assetHub
  if (!client) {
    console.error('❌ Staking client not connected')
    return false
  }

  try {
    const api = await client.getUnsafeApi()

    // Check if staking pallet exists
    if (!api.query.Staking) {
      console.error('❌ Staking pallet not available')
      return false
    }

    console.log('✅ Staking pallet found')

    // Query active era
    const activeEra = await api.query.Staking.ActiveEra.getValue()
    console.log(`  Current era: ${activeEra?.index || 'N/A'}`)

    // Query history depth
    const historyDepth = await api.query.Staking.HistoryDepth.getValue()
    console.log(`  History depth: ${historyDepth || 'N/A'}`)

    // Test with a stash address
    const testAddress = TEST_ADDRESSES[chainId].stash
    console.log(`\n  Testing with address: ${testAddress.slice(0, 12)}...`)

    // Query bonded (stash -> controller mapping)
    const controller = await api.query.Staking.Bonded.getValue(testAddress)
    console.log(`  Controller: ${controller || 'Not a stash'}`)

    // If we have a controller, query the ledger
    if (controller) {
      const ledger = await api.query.Staking.Ledger.getValue(controller)
      console.log(`  Ledger found: ${ledger ? '✅' : '❌'}`)

      if (ledger) {
        console.log(`    Stash in ledger: ${ledger.stash}`)
        console.log(`    Active: ${ledger.active.toString()}`)
        console.log(`    Total: ${ledger.total.toString()}`)
        console.log(`    Unlocking chunks: ${ledger.unlocking?.length || 0}`)
      }
    } else {
      // Try querying as controller
      const ledger = await api.query.Staking.Ledger.getValue(testAddress)
      console.log(`  Ledger (if controller): ${ledger ? '✅' : '❌'}`)

      if (ledger) {
        console.log(`    Stash: ${ledger.stash}`)
        console.log(`    Active: ${ledger.active.toString()}`)
      }
    }

    // Query nominators
    const nominators = await api.query.Staking.Nominators.getValue(testAddress)
    console.log(`  Nominators: ${nominators ? `✅ (${nominators.targets?.length || 0} targets)` : 'Not nominating'}`)

    // Query validators
    const validators = await api.query.Staking.Validators.getValue(testAddress)
    console.log(`  Validator prefs: ${validators ? `✅ (commission: ${validators.commission})` : 'Not a validator'}`)

    return true
  } catch (error) {
    console.error('❌ Query failed:', error)
    return false
  }
}

/**
 * Test 5: Get identity from People Chain
 */
async function testGetIdentity(address: string) {
  console.log(`\n=== Testing getIdentity for ${address.slice(0, 8)}... ===`)

  try {
    const identity = await multiChainServicePapi.getIdentity(address)

    if (identity) {
      console.log('✅ Identity found:')
      console.log(`  Display: ${identity.display || 'N/A'}`)
      console.log(`  Legal: ${identity.legal || 'N/A'}`)
      console.log(`  Web: ${identity.web || 'N/A'}`)
      console.log(`  Email: ${identity.email || 'N/A'}`)
      console.log(`  Twitter: ${identity.twitter || 'N/A'}`)
      return true
    } else {
      console.log('⚠️  No identity set for this account')
      return false
    }
  } catch (error) {
    console.error('❌ Failed to get identity:', error)
    return false
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║   PAPI Validator Controls - Comprehensive Tests   ║')
  console.log('╚════════════════════════════════════════════════════╝')

  // Test each chain
  for (const chainId of ['polkadot', 'kusama', 'paseo'] as const) {
    console.log(`\n\n${'='.repeat(60)}`)
    console.log(`TESTING ${chainId.toUpperCase()}`)
    console.log('='.repeat(60))

    // Connect
    const connected = await testConnection(chainId)
    if (!connected) {
      console.log(`\n⚠️  Skipping ${chainId} tests due to connection failure`)
      continue
    }

    // Test balance queries
    const addresses = TEST_ADDRESSES[chainId]
    await testGetBalance(addresses.validator, chainId)
    await testGetBalance(addresses.nominator, chainId)
    await testGetBalance(addresses.stash, chainId)

    // Test staking queries
    await testGetStakingInfo(addresses.validator, chainId)
    await testGetStakingInfo(addresses.nominator, chainId)
    await testGetStakingInfo(addresses.stash, chainId)

    // Test low-level queries
    await testStashControllerQueries(chainId)

    // Test identity
    await testGetIdentity(addresses.validator)

    // Disconnect
    await multiChainServicePapi.disconnect()
    console.log('\n✅ Disconnected')
  }

  console.log('\n\n╔════════════════════════════════════════════════════╗')
  console.log('║              Tests Complete                        ║')
  console.log('╚════════════════════════════════════════════════════╝\n')
}

// Export for use in browser console or node
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testVctl = runTests
  console.log('Test suite loaded. Run window.testVctl() to start tests.')
} else {
  // Node environment
  runTests().catch(console.error)
}

export { runTests, testConnection, testGetBalance, testGetStakingInfo, testStashControllerQueries, testGetIdentity }
