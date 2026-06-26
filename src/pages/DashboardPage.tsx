import { Component, createResource, createSignal, For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import {
  session,
  isSignedIn,
  identityLabel,
  logout,
  getAccount,
  getMyOrders,
} from '../lib/auth'
import SignInModal from '../components/SignInModal'

const money = (n: number) => '$' + (Number.isInteger(n) ? n : n.toFixed(2))

// Customer control panel: balance/runway, subscriptions, and orders, scoped to
// the signed-in account. All data comes from /v1/me/* with the session token.
const DashboardPage: Component = () => {
  const navigate = useNavigate()
  const [showSignIn, setShowSignIn] = createSignal(!isSignedIn())
  const [account, { refetch: refetchAcct }] = createResource(session, () =>
    isSignedIn() ? getAccount() : Promise.resolve(null),
  )
  const [orders, { refetch: refetchOrders }] = createResource(session, () =>
    isSignedIn() ? getMyOrders() : Promise.resolve([]),
  )

  // Runway: at the current monthly burn, how long does the balance last?
  const monthlyBurn = () =>
    (account()?.subscriptions ?? [])
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.monthly_micros / 1e6, 0)
  const runwayDays = () => {
    const burn = monthlyBurn()
    if (burn <= 0) return null
    return Math.floor(((account()?.balance_usd ?? 0) / burn) * 30)
  }

  const card = 'rounded-xl border border-gray-800 bg-gray-900/40 p-6'
  const refresh = () => {
    refetchAcct()
    refetchOrders()
  }

  return (
    <div class="max-w-5xl mx-auto px-6 lg:px-12 py-16">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-semibold text-white">Control panel</h1>
        <Show
          when={isSignedIn()}
          fallback={
            <button
              onClick={() => setShowSignIn(true)}
              class="px-4 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Sign in
            </button>
          }
        >
          <div class="flex items-center gap-3 text-sm">
            <a
              href="/hosting"
              class="px-3.5 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              + Deploy a server
            </a>
            <span class="text-gray-400 font-mono">{identityLabel()}</span>
            <button onClick={() => { logout(); navigate('/') }} class="text-gray-500 hover:text-white">
              Sign out
            </button>
          </div>
        </Show>
      </div>

      <Show
        when={isSignedIn()}
        fallback={<p class="text-gray-400">Sign in to view your balance, services, and orders.</p>}
      >
        {/* Balance + runway */}
        <div class="grid gap-5 md:grid-cols-3 mb-8">
          <div class={card}>
            <div class="text-sm text-gray-400">Balance</div>
            <div class="mt-1 text-3xl font-semibold text-white">{money(account()?.balance_usd ?? 0)}</div>
          </div>
          <div class={card}>
            <div class="text-sm text-gray-400">Monthly burn</div>
            <div class="mt-1 text-3xl font-semibold text-white">{money(monthlyBurn())}</div>
          </div>
          <div class={card}>
            <div class="text-sm text-gray-400">Runway</div>
            <div class="mt-1 text-3xl font-semibold text-white">
              <Show when={runwayDays() !== null} fallback="—">{runwayDays()} days</Show>
            </div>
          </div>
        </div>

        {/* Account */}
        <div class={card + ' mb-8'}>
          <h2 class="text-base font-semibold text-white mb-3">Account</h2>
          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-gray-500 text-xs mb-0.5">Identity</div>
              <div class="text-gray-200 font-mono break-all">{session()?.identity}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs mb-0.5">How billing works</div>
              <div class="text-gray-400">
                Paying an order credits your prepaid balance; active services bill
                against it each month. Pay with DOT, USDC, or USDt.
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div class={card + ' mb-8'}>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-white">Services</h2>
            <button onClick={refresh} class="text-xs text-gray-500 hover:text-cyan-400">Refresh</button>
          </div>
          <Show
            when={(account()?.subscriptions ?? []).length}
            fallback={
              <div class="text-sm text-gray-500">
                <p>No active services yet.</p>
                <a href="/hosting" class="inline-block mt-3 text-cyan-400 hover:text-cyan-300">
                  Deploy your first server →
                </a>
              </div>
            }
          >
            <div class="divide-y divide-gray-800">
              <For each={account()?.subscriptions}>
                {(s) => (
                  <div class="flex items-center justify-between py-3 text-sm">
                    <div>
                      <div class="text-gray-200">{s.label}</div>
                      <div class="text-xs text-gray-500">
                        {s.vmid ? `VM ${s.vmid}` : 'provisioning'} · {s.status}
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <Show when={s.vmid}>
                        <a
                          href={`/console/${s.vmid}`}
                          class="text-xs px-2.5 py-1 rounded-md border border-cyan-700/50 text-cyan-300 hover:bg-cyan-600/15 transition-colors"
                        >
                          Console →
                        </a>
                      </Show>
                      <span class="font-mono text-gray-300">{money(s.monthly_micros / 1e6)}/mo</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Orders */}
        <div class={card}>
          <h2 class="text-base font-semibold text-white mb-4">Orders</h2>
          <Show
            when={(orders() ?? []).length}
            fallback={
              <div class="text-sm text-gray-500">
                <p>No orders yet.</p>
                <a href="/hosting" class="inline-block mt-3 text-cyan-400 hover:text-cyan-300">
                  Browse servers →
                </a>
              </div>
            }
          >
            <div class="divide-y divide-gray-800">
              <For each={orders()}>
                {(o: any) => (
                  <div class="py-3 text-sm">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-200">{o.product} · {money(o.price_usd_month)}/mo</span>
                      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{o.status}</span>
                    </div>
                    <Show when={o.status === 'pending_payment' && o.payment?.destination}>
                      <div class="mt-2 text-xs text-gray-500">
                        Pay <span class="font-mono text-cyan-400">{o.payment.amount}</span> to{' '}
                        <span class="font-mono break-all text-gray-400">{o.payment.destination}</span>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={showSignIn()}>
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSignedIn={() => { setShowSignIn(false); refresh() }}
        />
      </Show>
    </div>
  )
}

export default DashboardPage
