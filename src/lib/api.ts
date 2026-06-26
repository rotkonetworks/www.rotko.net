// Rotko storefront API client → HermesHost (api.rotko.net).
//
// Points at VITE_API_URL. When unset, apiConfigured() is false and the order
// form falls back to the /api/contact email relay (quotes / no live backend).

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const apiConfigured = () => BASE.length > 0

export type ProductType = 'vm' | 'baremetal' | 'colocation'
/** Backend PaymentMethod (snake_case). */
export type PayMethod = 'dot' | 'usdc_polkadot' | 'btc' | 'zcash' | 'stripe'

export interface PaymentIntent {
  method: string
  /** Chain-native base units (plancks for DOT) or USD for Stripe. */
  amount: string
  /** Deposit address (crypto) or checkout URL (Stripe). */
  destination: string
  confirmations: number
  status: string
}

export interface Order {
  id: string
  product: ProductType
  status: string // pending_payment | paid | provisioning | active | failed
  price_usd_month: number
  email: string
  vmid: number | null
  payment: PaymentIntent
}

export interface CreateOrderReq {
  product: ProductType
  /** Structured build — priced + validated server-side. */
  config: Record<string, unknown>
  email: string
  method: PayMethod
}

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as any)
    throw new ApiError(body.message || body.error || `Request failed (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}

/** Create an order — price + deposit address come back from the server. */
export function createOrder(req: CreateOrderReq): Promise<Order> {
  if (!apiConfigured()) throw new ApiError('API not configured', 0)
  return request<Order>('/v1/orders', { method: 'POST', body: JSON.stringify(req) })
}

/** Poll an order's status (pending_payment → paid → active). */
export function getOrder(id: string): Promise<Order> {
  return request<Order>(`/v1/orders/${encodeURIComponent(id)}`)
}

/** Map storefront OS labels to backend image ids (config.os). */
export const OS_ID: Record<string, string> = {
  Debian: 'debian',
  Ubuntu: 'ubuntu',
  Proxmox: 'proxmox',
  'Arch Linux': 'arch',
  NixOS: 'nixos',
  Talos: 'talos',
}
