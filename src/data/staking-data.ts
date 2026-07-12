export interface StakingChainConfig {
  name: string
  assetHub: string
  relay: string
  ss58: number
  decimals: number
  token: string
  subscan: string
  color: string
  stakingType: 'substrate' | 'penumbra'
}

// DOT staking funnel: buy -> self-custody -> stake with Rotko.
// Guardarian chosen as on-ramp: cheapest all-in card fees (~1.4%) among
// widget providers, supports DOT, and works as a plain link — no partner
// API key needed. Swap `url` for a referral link once registered.
// Wallet: Nova only — one clear path (iPhone/Android), and its iCloud/
// Google Drive cloud backup means newcomers can't lose their keys.
export const STAKE_DOT = {
  onramp: {
    name: 'Guardarian',
    url: 'https://guardarian.com/buy-dot',
    feeNote: '~1.4% all-in card fee — lowest of the major on-ramps. KYC handled by Guardarian, DOT delivered straight to your own wallet.',
  },
  wallet: {
    name: 'Nova Wallet',
    platform: 'iPhone & Android',
    url: 'https://novawallet.io',
    steps: [
      'Install Nova Wallet from the App Store or Google Play and create a wallet.',
      'Enable cloud backup (iCloud on iPhone, Google Drive on Android) — your keys are recoverable even if you lose the phone.',
      'Copy your Polkadot address and use it as the delivery address when buying DOT.',
    ],
    note: 'Self-custodial: only you hold the keys. Cloud backup is encrypted with your password.',
  },
  products: {
    pool: {
      title: 'Nomination Pool',
      // On-chain pool id once created; null renders the launching-soon state.
      poolId: null as number | null,
      dashboardUrl: 'https://staking.polkadot.cloud',
      // Refs 1909/1910 (approved 2026-07-06): ~2-day unbonding + nominators
      // no longer slashable. Chain still reports 28 eras — keep "rolling out"
      // until BondingDuration actually changes on AH.
      blurb: 'Pooled staking, auto-nominating the highest-return validators in the active set. Join with any amount from 1 DOT. Under Polkadot’s July 2026 staking reforms, nominators are no longer slashable and unbonding drops from 28 days to ~2 (rolling out network-wide).',
    },
    saav: {
      title: 'Staking as a Validator',
      ticker: 'svDOT',
      blurb: 'Your DOT works as validator self-stake instead of a nomination — earning validator-side economics, not the nominator average. Fully liquid: you hold svDOT while the stake works.',
      status: 'Early access',
      bookingUrl: 'https://cal.com/rotko',
    },
  },
  validator: {
    name: 'rotko.net/dot01',
    address: '1ArdZJtNUrZsfidfn1t69xHaSWwzf6PQNdLEUpcnVmbkZc5',
  },
}

export const STAKING_CHAINS: Record<string, StakingChainConfig> = {
  polkadot: {
    name: 'Polkadot',
    assetHub: 'wss://asset-hub-polkadot.rotko.net',
    relay: 'wss://polkadot.rotko.net',
    ss58: 0,
    decimals: 10,
    token: 'DOT',
    subscan: 'https://polkadot.subscan.io',
    color: 'pink',
    stakingType: 'substrate'
  },
  kusama: {
    name: 'Kusama',
    assetHub: 'wss://asset-hub-kusama.rotko.net',
    relay: 'wss://kusama.rotko.net',
    ss58: 2,
    decimals: 12,
    token: 'KSM',
    subscan: 'https://kusama.subscan.io',
    color: 'gray',
    stakingType: 'substrate'
  },
  paseo: {
    name: 'Paseo',
    assetHub: 'wss://asset-hub-paseo.rotko.net',
    relay: 'wss://paseo.rotko.net',
    ss58: 0,
    decimals: 10,
    token: 'PAS',
    subscan: 'https://paseo.subscan.io',
    color: 'green',
    stakingType: 'substrate'
  },
  penumbra: {
    name: 'Penumbra',
    assetHub: '',
    relay: '',
    ss58: 0,
    decimals: 6,
    token: 'UM',
    subscan: 'https://explorer.penumbra.zone',
    color: 'purple',
    stakingType: 'penumbra'
  }
}
