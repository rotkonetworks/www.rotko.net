import { Component, createSignal, createResource, Show, For, onCleanup } from 'solid-js'
import {
  apiConfigured,
  createOrder,
  getOrder,
  OS_ID,
  type Order,
  type PayMethod,
  type ProductType,
} from '../lib/api'
import { session, isSignedIn, getAccount, settleOnCredit } from '../lib/auth'

const money = (n: number) => '$' + (Number.isInteger(n) ? n : n.toFixed(2))

// Payment rails offered at checkout. USDC default (stable, no price exposure).
const PAY_METHODS: { id: PayMethod; label: string; decimals: number; note: string }[] = [
  { id: 'usdc_polkadot', label: 'USDC', decimals: 1e6, note: 'stable' },
  { id: 'usdt_polkadot', label: 'USDT', decimals: 1e6, note: 'stable' },
  { id: 'dot', label: 'DOT', decimals: 1e10, note: '' },
]
const payInfo = (id: string) => PAY_METHODS.find((m) => m.id === id) ?? PAY_METHODS[0]
const fmtAmount = (o: Order) =>
  `${(Number(o.payment.amount) / payInfo(o.payment.method).decimals).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${payInfo(o.payment.method).label}`

type Status = 'idle' | 'sending' | 'sent' | 'awaiting' | 'active' | 'error'
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

// Images we install. Proxmox is the default (turns a node into a VM host).
export const OS_OPTIONS = ['Debian', 'Ubuntu', 'Proxmox', 'Arch Linux', 'NixOS', 'Talos']
export const OS_DEFAULT = 'Ubuntu'

interface OrderFormProps {
  title: string
  summary: string[]
  onClose: () => void
  submitLabel?: string
  sentLabel?: string
  /** When set, show an OS picker (VM / bare metal). Omit for colocation. */
  osOptions?: string[]
  /** Structured build for the real API. With it (+ API configured) the form
   *  creates a real order and shows the payment screen; without it, it falls
   *  back to the /api/contact relay. */
  product?: ProductType
  config?: Record<string, unknown>
}


const OrderForm: Component<OrderFormProps> = (props) => {
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal(session()?.identity?.replace(/^email:/, '') ?? '')
  const [hostname, setHostname] = createSignal('')
  const [sshKey, setSshKey] = createSignal('')
  const [os, setOs] = createSignal(props.osOptions?.includes(OS_DEFAULT) ? OS_DEFAULT : (props.osOptions?.[0] ?? ''))
  const [notes, setNotes] = createSignal('')
  const [company, setCompany] = createSignal('') // honeypot
  const [status, setStatus] = createSignal<Status>('idle')
  const [error, setError] = createSignal('')
  const [order, setOrder] = createSignal<Order | null>(null)
  const [payMethod, setPayMethod] = createSignal<PayMethod>('usdc_polkadot')
  // How this order settles: 'credit' draws the account's credit line (funded
  // accounts, no crypto screen); 'crypto' shows a one-time deposit address.
  const [settleMode, setSettleMode] = createSignal<'credit' | 'crypto'>('credit')
  const [settledOnCredit, setSettledOnCredit] = createSignal(false)

  // Account credit (signed-in real flow only) → drives the "Deploy on credit" path.
  const [account] = createResource(
    () => (isSignedIn() ? session() : null),
    () => getAccount().catch(() => null),
  )
  const availableCredit = () => account()?.available_usd ?? 0
  const hasCredit = () => availableCredit() > 0
  // Draw the line when the account can and the user hasn't switched to crypto.
  const useCredit = () => hasCredit() && settleMode() === 'credit'

  const field =
    'w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-600 transition-colors outline-none'

  const realFlow = () => !!(props.product && props.config && apiConfigured())

  let poll: ReturnType<typeof setInterval> | undefined
  onCleanup(() => poll && clearInterval(poll))

  const startPolling = (id: string) => {
    poll = setInterval(async () => {
      try {
        const o = await getOrder(id)
        setOrder(o)
        if (o.status === 'active') {
          setStatus('active')
          clearInterval(poll)
        }
      } catch {
        /* keep polling */
      }
    }, 4000)
  }

  const buildOrder = () => {
    // A signed-in user's order is scoped to their account identity.
    const acct = session()?.identity ?? email().trim()
    const config: Record<string, unknown> = { ...props.config }
    if (props.osOptions) config.os = OS_ID[os()] ?? os().toLowerCase()
    if (sshKey().trim()) config.ssh_key = sshKey().trim()
    if (hostname().trim()) config.hostname = hostname().trim()
    return createOrder({ product: props.product!, config, email: acct, method: payMethod() })
  }

  const submitReal = async () => {
    setStatus('sending')
    setError('')
    try {
      const o = await buildOrder()
      setOrder(o)
      // Funded account → draw the credit line and provision now (no deposit).
      if (useCredit() && availableCredit() >= o.price_usd_month) {
        try {
          await settleOnCredit(o.id)
          setSettledOnCredit(true)
          setStatus('awaiting') // provisioning on credit; poll to active
          startPolling(o.id)
          return
        } catch {
          // Credit didn't take (race / insufficient) → fall back to crypto.
          setSettleMode('crypto')
        }
      }
      setStatus('awaiting')
      startPolling(o.id)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not create order.')
    }
  }

  const submitContact = async () => {
    setStatus('sending')
    setError('')
    const message = [
      props.title, '', ...props.summary,
      ...(props.osOptions ? [`OS image: ${os()}`] : []),
      '', `Hostname: ${hostname().trim() || '(not set)'}`, `Notes: ${notes().trim() || '-'}`,
    ].join('\n')
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name().trim(), email: email().trim(), message, company: company() }),
      })
      if (!r.ok) {
        const b = await r.json().catch(() => ({}))
        throw new Error(b.error || `Something went wrong (${r.status}).`)
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    }
  }

  const submit = (e: Event) => {
    e.preventDefault()
    if (!realFlow() && !emailOk(email())) {
      setStatus('error')
      setError('Enter a valid email so we can confirm your order.')
      return
    }
    if (realFlow() && !session() && !emailOk(email())) {
      setStatus('error')
      setError('Enter a valid email (or sign in) for your account.')
      return
    }
    realFlow() ? submitReal() : submitContact()
  }

  return (
    <div
      class="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={props.onClose}
    >
      <div class="w-full max-w-lg my-8 rounded-xl border border-gray-700 bg-gray-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 class="text-lg font-semibold text-white">{props.title}</h2>
          <button onClick={props.onClose} aria-label="Close" class="text-gray-500 hover:text-white"><span class="i-mdi-close text-xl" /></button>
        </div>

        {/* === Provisioned === */}
        <Show when={status() === 'active'}>
          <div class="p-6 text-center">
            <p class="text-white font-semibold flex items-center justify-center gap-2">
              <span class="i-mdi-check-circle text-green-400" /> Provisioned — VM #{order()?.vmid}
            </p>
            <p class="text-sm text-gray-400 mt-2">Your server is live. Open the console or manage it from your dashboard.</p>
            <div class="mt-5 flex gap-3 justify-center">
              <a href={`/console/${order()?.vmid}`} class="px-4 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white">Open console →</a>
              <a href="/dashboard" class="px-4 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-cyan-600">Dashboard</a>
            </div>
          </div>
        </Show>

        {/* === Provisioning on credit (no deposit) === */}
        <Show when={status() === 'awaiting' && settledOnCredit()}>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-2 text-sm text-gray-200">
              <span class="i-mdi-loading animate-spin text-cyan-400" /> Provisioning on your credit line…
            </div>
            <p class="text-xs text-gray-500">
              {order() ? `${money(order()!.price_usd_month)}/mo` : ''} drawn from your account —
              this can take a minute. You can close this; track it in your dashboard.
            </p>
            <button onClick={props.onClose} class="text-xs text-gray-500 hover:text-gray-300">Close — provisioning continues.</button>
          </div>
        </Show>

        {/* === Awaiting payment (crypto) === */}
        <Show when={status() === 'awaiting' && !settledOnCredit()}>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-300">Send the exact amount to your one-time deposit address. We detect it on-chain and provision automatically.</p>
            <div class="rounded-lg border border-gray-800 bg-gray-900/40 p-4 space-y-3">
              <div>
                <div class="text-xs uppercase tracking-wider text-gray-500">Amount</div>
                <div class="font-mono text-cyan-300 text-lg">{order() ? fmtAmount(order()!) : '…'}</div>
              </div>
              <div>
                <div class="text-xs uppercase tracking-wider text-gray-500">Deposit address (Asset Hub)</div>
                <div class="font-mono text-gray-300 text-sm break-all select-all">{order()?.payment.destination || '…'}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-400">
              <span class="i-mdi-loading animate-spin text-cyan-400" /> Waiting for payment… (order {order()?.status})
            </div>
            <button onClick={props.onClose} class="text-xs text-gray-500 hover:text-gray-300">Close — provisioning continues; track it in your dashboard.</button>
          </div>
        </Show>

        {/* === Confirmation (contact relay) === */}
        <Show when={status() === 'sent'}>
          <div class="p-6">
            <p class="text-white font-semibold flex items-center gap-2"><span class="i-mdi-check-circle text-cyan-400" /> {props.sentLabel ?? 'Request received.'}</p>
            <p class="text-sm text-gray-400 mt-2">Thanks, we'll confirm your build and pricing at {email()} shortly.</p>
            <button onClick={props.onClose} class="mt-5 px-5 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white">Done</button>
          </div>
        </Show>

        {/* === Form === */}
        <Show when={status() === 'idle' || status() === 'sending' || status() === 'error'}>
          <form class="p-6 space-y-4" onSubmit={submit}>
            <div class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
              <div class="text-xs uppercase tracking-wider text-gray-500 mb-2">Your build</div>
              <ul class="space-y-1 text-sm text-gray-300"><For each={props.summary}>{(line) => <li>{line}</li>}</For></ul>
            </div>

            <Show when={props.osOptions}>
              <div>
                <label class="block text-sm text-gray-400 mb-1" for="o-os">Operating system</label>
                <select id="o-os" class={field} value={os()} onChange={(e) => setOs(e.currentTarget.value)}>
                  <For each={props.osOptions}>{(o) => <option value={o}>{o}{o === OS_DEFAULT ? ' (default)' : ''}</option>}</For>
                </select>
              </div>
            </Show>

            {/* SSH key — only for the real provisioning flow */}
            <Show when={realFlow() && props.osOptions}>
              <div>
                <label class="block text-sm text-gray-400 mb-1" for="o-ssh">SSH public key <span class="text-gray-600">(for login)</span></label>
                <textarea id="o-ssh" class={field} rows="2" placeholder="ssh-ed25519 AAAA… you@host" value={sshKey()} onInput={(e) => setSshKey(e.currentTarget.value)} />
              </div>
            </Show>

            {/* Settlement — credit line (funded accounts) or a crypto rail. */}
            <Show when={realFlow()}>
              <Show
                when={useCredit()}
                fallback={
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="block text-sm text-gray-400">Pay with</label>
                      <Show when={hasCredit()}>
                        <button type="button" onClick={() => setSettleMode('credit')}
                          class="text-xs text-cyan-400 hover:text-cyan-300">Use credit instead</button>
                      </Show>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                      <For each={PAY_METHODS}>
                        {(m) => (
                          <button
                            type="button"
                            onClick={() => setPayMethod(m.id)}
                            class="px-3 py-2 text-sm rounded-md border transition-colors"
                            classList={{
                              'border-cyan-600 bg-cyan-600/15 text-cyan-300': payMethod() === m.id,
                              'border-gray-700 text-gray-300 hover:border-gray-600': payMethod() !== m.id,
                            }}
                          >
                            {m.label}{m.note ? <span class="block text-[10px] text-gray-500">{m.note}</span> : null}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                }
              >
                <div class="rounded-lg border border-cyan-700/50 bg-cyan-600/10 p-4">
                  <div class="flex items-center justify-between gap-2">
                    <span class="flex items-center gap-2 text-sm text-cyan-200">
                      <span class="i-mdi-credit-card-check-outline text-lg" /> Deploy on your credit line
                    </span>
                    <button type="button" onClick={() => setSettleMode('crypto')}
                      class="text-xs text-gray-400 hover:text-gray-200">Pay with crypto instead</button>
                  </div>
                  <p class="text-xs text-gray-400 mt-2">
                    {money(availableCredit())} available · billed monthly to your account, settled by invoice.
                  </p>
                </div>
              </Show>
            </Show>

            <Show when={!session()}>
              <div>
                <label class="block text-sm text-gray-400 mb-1" for="o-email">Email</label>
                <input id="o-email" class={field} type="email" placeholder="you@example.com" value={email()} onInput={(e) => setEmail(e.currentTarget.value)} autocomplete="email" />
              </div>
            </Show>

            <div class="grid sm:grid-cols-2 gap-4">
              <Show when={!realFlow()}>
                <div>
                  <label class="block text-sm text-gray-400 mb-1" for="o-name">Name / company <span class="text-gray-600">(optional)</span></label>
                  <input id="o-name" class={field} value={name()} onInput={(e) => setName(e.currentTarget.value)} autocomplete="name" />
                </div>
              </Show>
              <div>
                <label class="block text-sm text-gray-400 mb-1" for="o-host">Hostname <span class="text-gray-600">(optional)</span></label>
                <input id="o-host" class={field} placeholder="node1" value={hostname()} onInput={(e) => setHostname(e.currentTarget.value)} />
              </div>
            </div>

            <Show when={!realFlow()}>
              <div>
                <label class="block text-sm text-gray-400 mb-1" for="o-notes">Notes</label>
                <textarea id="o-notes" class={field} rows="3" value={notes()} onInput={(e) => setNotes(e.currentTarget.value)} />
              </div>
            </Show>

            <input class="absolute left-[-9999px] w-px h-px opacity-0" tabindex="-1" autocomplete="off" aria-hidden="true" name="company" value={company()} onInput={(e) => setCompany(e.currentTarget.value)} />

            <Show when={status() === 'error'}><p class="text-sm text-red-400">{error()}</p></Show>

            <button type="submit" disabled={status() === 'sending'}
              class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors">
              {status() === 'sending'
                ? 'Working…'
                : !realFlow()
                  ? (props.submitLabel ?? 'Place order →')
                  : useCredit()
                    ? 'Deploy on credit →'
                    : `Pay with ${payInfo(payMethod()).label} →`}
            </button>
            <p class="text-xs text-gray-500 text-center">
              {!realFlow()
                ? 'No charge yet, we confirm the build and pricing before provisioning.'
                : useCredit()
                  ? 'Provisions now on your credit line; billed monthly and settled by invoice.'
                  : 'You pay on Asset Hub; we detect it and provision automatically.'}
            </p>
          </form>
        </Show>
      </div>
    </div>
  )
}

export default OrderForm
