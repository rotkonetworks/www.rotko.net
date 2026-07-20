// SS58 address helpers via polkadot-api (papi), not polkadotjs.
//
// Wallets hand back addresses in whatever network prefix they're set to (often
// the generic prefix-42 "5…" form). We key + display everything in canonical
// Polkadot format (prefix 0, the "1…" form) so one key is always one account —
// matching the backend's identity normalization.

import { AccountId } from '@polkadot-api/substrate-bindings'

const pubkey = AccountId() // decode any-prefix SS58 → 32-byte account id
const polkadot = AccountId(0) // encode → Polkadot prefix 0 ("1…")

/** Re-encode any substrate SS58 address to canonical Polkadot format ("1…").
 *  Returns the input unchanged if it isn't a decodable SS58 address. */
export function toPolkadotAddress(addr: string): string {
  try {
    return polkadot.dec(pubkey.enc(addr))
  } catch {
    return addr
  }
}

/** Short display form of a Polkadot address, e.g. "14iH…BfCL". */
export function shortAddress(addr: string): string {
  const a = toPolkadotAddress(addr)
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}
