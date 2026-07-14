// Control-panel auth client: wallet sign-in (Polkadot / Ethereum / Solana) and
// email magic-link, against HermesHost (api.rotko.net).
//
// Flow: get a challenge → sign with the wallet → POST the signature → receive an
// opaque session token (stored in localStorage). The token rides in the
// Authorization header on every panel request.
//
// Wallet signing uses the injected provider APIs directly (no SDK deps). The
// exact message framing per wallet is the part to confirm against the real
// extensions — see notes inline.

import { createSignal } from 'solid-js'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const STORAGE_KEY = 'rotko_session'

export type Chain = 'polkadot' | 'ethereum' | 'solana'

export interface Session {
  token: string
  identity: string
  expires_at: number
}

// --- session state (reactive) ---
const [session, setSessionSignal] = createSignal<Session | null>(loadSession())
export { session }

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (s.expires_at * 1000 < Date.now()) return null
    return s
  } catch {
    return null
  }
}

function setSession(s: Session | null) {
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  else localStorage.removeItem(STORAGE_KEY)
  setSessionSignal(s)
}

export function isSignedIn(): boolean {
  return session() !== null
}

/** Short, human label for the signed-in identity (e.g. "1pzeP…Xp4" or email). */
export function identityLabel(): string {
  const id = session()?.identity ?? ''
  const [kind, ...rest] = id.split(':')
  const val = rest.join(':')
  if (kind === 'email') return val
  if (val.length > 12) return `${val.slice(0, 6)}…${val.slice(-4)}`
  return val || id
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const s = session()
  if (s) headers['Authorization'] = `Bearer ${s.token}`
  const res = await fetch(`${BASE}${path}`, { headers, ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any))
    throw new Error(body.message || body.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function logout() {
  api('/v1/auth/logout', { method: 'POST' }).catch(() => {})
  setSession(null)
}

// ---------------------------------------------------------------------------
// Email magic-link
// ---------------------------------------------------------------------------

export async function startEmailLogin(email: string): Promise<void> {
  await api('/v1/auth/email/start', { method: 'POST', body: JSON.stringify({ email }) })
}

/** Called by the /auth/verify page with the token from the email link. */
export async function verifyEmailToken(token: string): Promise<Session> {
  const s = await api<Session>('/v1/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  setSession(s)
  return s
}

// ---------------------------------------------------------------------------
// Wallet sign-in
// ---------------------------------------------------------------------------

async function challenge(chain: Chain, address: string): Promise<string> {
  const r = await api<{ message: string }>('/v1/auth/wallet/challenge', {
    method: 'POST',
    body: JSON.stringify({ chain, address }),
  })
  return r.message
}

async function verifyWallet(chain: Chain, address: string, signature: string): Promise<Session> {
  const s = await api<Session>('/v1/auth/wallet/verify', {
    method: 'POST',
    body: JSON.stringify({ chain, address, signature }),
  })
  setSession(s)
  return s
}

const toHex = (bytes: Uint8Array) =>
  '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
const utf8Hex = (s: string) => toHex(new TextEncoder().encode(s))

export interface WalletAccount {
  address: string
  name?: string
}

/**
 * Polkadot via an injected extension (Talisman / Polkadot.js / SubWallet).
 *
 * Two-phase: enable the extension ONCE, then return every account it exposes
 * plus a `signIn(address)` closure bound to that same enabled extension. Unlike
 * MetaMask/Phantom, Polkadot extensions hand back all accounts programmatically
 * with no in-wallet account prompt, so the UI must let the user pick which one.
 */
export async function connectPolkadot(): Promise<{
  accounts: WalletAccount[]
  signIn: (address: string) => Promise<Session>
}> {
  const injected = (window as any).injectedWeb3
  if (!injected || Object.keys(injected).length === 0) {
    throw new Error('No Polkadot wallet found. Install Talisman or Polkadot.js.')
  }
  const key = injected['talisman'] ? 'talisman' : Object.keys(injected)[0]
  const ext = await injected[key].enable('Rotko Networks')
  const raw = await ext.accounts.get()
  if (!raw.length) throw new Error('No accounts in your Polkadot wallet.')
  const accounts: WalletAccount[] = raw.map((a: any) => ({ address: a.address, name: a.name }))

  const signIn = async (address: string): Promise<Session> => {
    const message = await challenge('polkadot', address)
    // signRaw(type:'bytes') wraps the decoded bytes in <Bytes>…</Bytes> and
    // sr25519-signs — matching the backend's verification.
    const { signature } = await ext.signer.signRaw({
      address,
      data: utf8Hex(message),
      type: 'bytes',
    })
    return verifyWallet('polkadot', address, signature)
  }

  return { accounts, signIn }
}

/** Single-account convenience: connect and auto-sign when there's exactly one. */
export async function signInPolkadot(): Promise<Session> {
  const { accounts, signIn } = await connectPolkadot()
  return signIn(accounts[0].address)
}

/** Ethereum via window.ethereum (MetaMask, etc.) using personal_sign. */
export async function signInEthereum(): Promise<Session> {
  const eth = (window as any).ethereum
  if (!eth) throw new Error('No Ethereum wallet found. Install MetaMask.')
  const [address] = await eth.request({ method: 'eth_requestAccounts' })
  const message = await challenge('ethereum', address)
  const signature = await eth.request({ method: 'personal_sign', params: [message, address] })
  return verifyWallet('ethereum', address, signature)
}

/** Solana via window.solana (Phantom) using signMessage. */
export async function signInSolana(): Promise<Session> {
  const sol = (window as any).solana
  if (!sol) throw new Error('No Solana wallet found. Install Phantom.')
  const resp = await sol.connect()
  const address = (resp?.publicKey ?? sol.publicKey).toString()
  const message = await challenge('solana', address)
  const { signature } = await sol.signMessage(new TextEncoder().encode(message), 'utf8')
  return verifyWallet('solana', address, toHex(signature as Uint8Array))
}

// ---------------------------------------------------------------------------
// Panel data
// ---------------------------------------------------------------------------

/** Shared-IPv4 SSH gateway: reach an IPv6-only VM from any network via a
 *  port-forwarding relay. Optional — null when the gateway is disabled. */
export interface SshGateway {
  host: string
  port: number
  command: string
}

export interface Subscription {
  id: string
  vmid: number | null
  label: string
  monthly_micros: number
  next_due: number
  status: string
  /** Current VM specs (present once provisioned) — drive the resize panel. */
  vcpu?: number
  ram_gb?: number
  disk_gb?: number
  /** Shared-IPv4 SSH command, when the gateway is enabled for this VM. */
  ssh_gateway?: SshGateway | null
}

export interface AccountView {
  identity: string
  balance_usd: number
  subscriptions: Subscription[]
}

export const getAccount = () => api<AccountView>('/v1/me/account')
export const getMyOrders = () => api<any[]>('/v1/me/orders')

// ---------------------------------------------------------------------------
// Free trial
// ---------------------------------------------------------------------------

export interface TrialResult {
  vmid: number
  ipv6: string
  ssh: string
  /** Shared-IPv4 SSH command, when the gateway is enabled. Null = disabled. */
  ssh_gateway?: SshGateway | null
  /** Unix seconds: free period ends (VM locks). */
  free_until: number
  /** Unix seconds: VM is deleted unless kept. */
  delete_at: number
  keep: {
    order_id: string
    amount: string
    method: string
    destination: string
    price_usd_month: number
  }
}

/** Launch a free trial VM (signed-in users only). */
export const startTrial = (ssh_key: string, method = 'usdc_polkadot') =>
  api<TrialResult>('/v1/trial', {
    method: 'POST',
    body: JSON.stringify({ ssh_key, method }),
  })

// ---------------------------------------------------------------------------
// Consoles
// ---------------------------------------------------------------------------

/** ws:// base derived from VITE_API_URL (http→ws, https→wss). */
export const WS_BASE = (import.meta.env.VITE_API_URL || '')
  .replace(/^http/, 'ws')
  .replace(/\/+$/, '')

/** Websocket URL for a VM's SSH console. */
export function openVmConsole(vmid: number | string): string {
  return `${WS_BASE}/v1/me/vms/${vmid}/console?token=${session()?.token ?? ''}`
}

/** Websocket URL for the shared demo web shell (signed-in users). */
export function openDemoConsole(): string {
  return `${WS_BASE}/v1/me/console/demo?token=${session()?.token ?? ''}`
}

// ---------------------------------------------------------------------------
// Resize / upgrade
// ---------------------------------------------------------------------------

export interface ResizeSpec {
  vcpu: number
  ram_gb: number
  disk_gb: number
}

export interface ResizeResult {
  price_usd_month: number
  applied: ResizeSpec
}

/** Resize a VM (disk is grow-only, enforced server-side too). */
export const resizeVm = (vmid: number | string, spec: ResizeSpec) =>
  api<ResizeResult>(`/v1/me/vms/${vmid}/resize`, {
    method: 'POST',
    body: JSON.stringify(spec),
  })
