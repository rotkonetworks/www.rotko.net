export interface ChainConfig {
  name: string
  relay: string
  assetHub: string
  ss58: number
  decimals: number
  token: string
}

// Rotko's validator addresses per chain
export const ROTKO_VALIDATORS: Record<string, { address: string; name: string }[]> = {
  polkadot: [
    { address: '1ArdZJtNUrZsfidfn1t69xHaSWwzf6PQNdLEUpcnVmbkZc5', name: 'rotko.net/dot01' },
  ],
  kusama: [
    { address: 'ESSZefozpZYVLbLF1vaGtabthQYg8PVXiTytVm6YiiwAnee', name: 'rotko.net/ksm01' },
    { address: 'DKKax6uZkiNPfd2ATd8cJhyi3c1KZD24VDdoWG9CfTmwgSp', name: 'rotko.net/ksm02' },
    { address: 'H4La9AvRKWu7Z4EcDbiVTTvY1eVj9L3SN32ocFNrjXAYNUw', name: 'rotko.net/ksm03' },
  ],
  paseo: []
}

export const validatorData = {
  hero: {
    title: "Validator Tool",
    subtitle: "Manage validators across Polkadot ecosystem chains"
  },

  chains: {
    polkadot: {
      name: 'Polkadot',
      relay: 'wss://polkadot.dotters.network',
      assetHub: 'wss://asset-hub-polkadot.dotters.network',
      ss58: 0,
      decimals: 10,
      token: 'DOT'
    },
    kusama: {
      name: 'Kusama',
      relay: 'wss://kusama.dotters.network',
      assetHub: 'wss://asset-hub-kusama.dotters.network',
      ss58: 2,
      decimals: 12,
      token: 'KSM'
    },
    paseo: {
      name: 'Paseo',
      relay: 'wss://paseo-rpc.dwellir.com',
      assetHub: 'wss://paseo-asset-hub-rpc.polkadot.io',
      ss58: 42,
      decimals: 10,
      token: 'PAS'
    }
  },

  sections: {
    account: {
      title: "Account & Keys",
      seedPlaceholder: "Enter seed phrase or hex private key",
      addressPlaceholder: "Address will appear here",
      deriveButton: "Derive Address",
      queryButton: "Query Account"
    },
    sessionKeys: {
      title: "Session Keys",
      rotateLabel: "How to Rotate Keys",
      rotateCommand: [
        'curl -H "Content-Type: application/json" \\',
        '  -d \'{"id":1,"jsonrpc":"2.0","method":"author_rotateKeys"}\' \\',
        '  http://YOUR_VALIDATOR:9933'
      ],
      checkLabel: "Check Current Keys",
      checkPlaceholder: "Validator address to check",
      queryButton: "Query Session Keys",
      setLabel: "Set Session Keys (hex)",
      setPlaceholder: "0x... (paste rotated keys here)",
      setButton: "Set Session Keys"
    },
    bonding: {
      title: "Bonding",
      amountLabel: "Amount to Bond",
      rewardLabel: "Reward Destination",
      rewardOptions: [
        { value: 'Staked', label: 'Staked (compound)' },
        { value: 'Stash', label: 'Stash' },
        { value: 'Controller', label: 'Controller' }
      ],
      bondButton: "Bond Tokens"
    },
    validation: {
      title: "Validation",
      commissionLabel: "Commission (%)",
      blockNominationsLabel: "Block nominations",
      startButton: "Start Validating",
      stopButton: "Stop Validating"
    },
    unbonding: {
      title: "Unbonding",
      amountLabel: "Amount to Unbond",
      unbondButton: "Unbond Tokens",
      withdrawButton: "Withdraw Unbonded"
    },
    validators: {
      title: "Active Validators",
      loading: "Loading validators...",
      noValidators: "No validators found"
    }
  },

  messages: {
    notConnected: "Not connected",
    connectionFailed: "Connection failed",
    pleaseEnterSeed: "Please enter a seed phrase",
    pleaseEnterAddress: "Please enter a validator address",
    pleaseDeriveAddress: "Please derive address first",
    pleaseEnterAmount: "Please enter amount",
    pleaseEnterKeys: "Please enter session keys",
    addressDerived: "Address derived",
    keysPending: "Keys are set and will be active next session",
    noKeysSet: "No keys set for next session",
    activeValidator: "Currently active as validator",
    keysSetSuccess: "Keys set in block",
    bondSuccess: "Bonded",
    unbondSuccess: "Unbonded",
    withdrawSuccess: "Withdrew unbonded funds",
    validationStarted: "Started validating with",
    validationStopped: "Stopped validating",
    queryFailed: "Query failed",
    transactionFailed: "Transaction failed"
  }
}