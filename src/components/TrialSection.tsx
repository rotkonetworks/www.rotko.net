import { Component, createSignal, Show, onCleanup } from 'solid-js'
import { isSignedIn, startTrial, type TrialResult } from '../lib/auth'
import SignInModal from './SignInModal'

/** Format a chain-native amount for display from the payment method. */
const fmtAmount = (amount: string, method: string): string => {
  const n = Number(amount)
  const m = method.toLowerCase()
  if (m.includes('dot')) return `${(n / 1e10).toFixed(4)} DOT`
  if (m.includes('usdt')) return `$${(n / 1e6).toFixed(2)} USDt`
  if (m.includes('usdc')) return `$${(n / 1e6).toFixed(2)} USDC`
  return amount
}

const mmss = (secs: number): string => {
  const s = Math.max(0, Math.floor(secs))
  const m = Math.floor(s / 60)
  return `${m}m ${String(s % 60).padStart(2, '0')}s`
}

/** "Try free for 30 minutes" — provisions a real VM at no cost; it locks after
 *  30 min and self-deletes within an hour unless the user pays to keep it. */
const TrialSection: Component = () => {
  const [showSignIn, setShowSignIn] = createSignal(false)
  const [sshKey, setSshKey] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')
  const [result, setResult] = createSignal<TrialResult | null>(null)
  const [now, setNow] = createSignal(Math.floor(Date.now() / 1000))

  const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
  onCleanup(() => clearInterval(timer))

  const launch = async () => {
    setError('')
    if (!isSignedIn()) {
      setShowSignIn(true)
      return
    }
    const key = sshKey().trim()
    if (!key.startsWith('ssh-')) {
      setError('Paste a valid SSH public key (it starts with "ssh-").')
      return
    }
    setLoading(true)
    try {
      setResult(await startTrial(key))
    } catch (e: any) {
      setError(e?.message || 'Could not start the trial.')
    } finally {
      setLoading(false)
    }
  }

  const freeLeft = () => (result() ? result()!.free_until - now() : 0)
  const deleteLeft = () => (result() ? result()!.delete_at - now() : 0)
  const locked = () => result() !== null && freeLeft() <= 0
  const gone = () => result() !== null && deleteLeft() <= 0

  const card =
    'rounded-xl border border-cyan-700/50 bg-gradient-to-r from-cyan-950/30 to-gray-900/40 p-6 md:p-7'

  return (
    <section class="py-6 px-4 max-w-6xl mx-auto">
      <div class={card}>
        <div class="flex items-center gap-2 mb-2">
          <span class="i-mdi-rocket-launch text-cyan-400 text-xl" />
          <span class="text-xs uppercase tracking-[0.18em] text-cyan-400/90">
            Try before you buy
          </span>
        </div>

        <Show
          when={result()}
          fallback={
            <>
              <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight">
                Launch a real VM free for 30 minutes
              </h2>
              <p class="text-sm text-gray-400 mt-2 max-w-2xl">
                A live IPv6 VM on our Bangkok fleet — no charge. It locks after 30
                minutes and is deleted within the hour unless you pay to keep it.
                Paste your SSH public key and go.
              </p>

              <div class="mt-4 flex flex-col gap-3 max-w-2xl">
                <textarea
                  value={sshKey()}
                  onInput={(e) => setSshKey(e.currentTarget.value)}
                  placeholder="ssh-ed25519 AAAA... you@host"
                  rows={2}
                  class="w-full rounded-md bg-gray-950/60 border border-gray-800 px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:border-cyan-600 outline-none resize-none"
                />
                <Show when={error()}>
                  <p class="text-sm text-red-400">{error()}</p>
                </Show>
                <div>
                  <button
                    onClick={launch}
                    disabled={loading()}
                    class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white transition-colors"
                  >
                    {loading()
                      ? 'Launching…'
                      : isSignedIn()
                        ? 'Launch free VM →'
                        : 'Sign in to launch →'}
                  </button>
                </div>
              </div>
            </>
          }
        >
          {/* Provisioned: show access + countdown + keep-it payment */}
          <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight">
            <Show when={gone()} fallback={`Your trial VM is ${locked() ? 'locked' : 'live'}`}>
              Trial expired
            </Show>
          </h2>

          <Show
            when={!gone()}
            fallback={
              <p class="text-sm text-gray-400 mt-2">
                This trial was deleted. You can start a new one anytime.
              </p>
            }
          >
            <div class="mt-3 grid gap-4 md:grid-cols-2">
              <div class="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
                <div class="text-xs text-gray-500 mb-1">Connect</div>
                <code class="block text-sm font-mono text-cyan-300 break-all">
                  {result()!.ssh}
                </code>
                <div class="text-xs text-gray-500 mt-3">
                  <Show
                    when={!locked()}
                    fallback={<span class="text-amber-400">Locked — pay below to unlock & keep.</span>}
                  >
                    Free time left:{' '}
                    <span class="font-mono text-white">{mmss(freeLeft())}</span>
                  </Show>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Deletes in <span class="font-mono text-gray-300">{mmss(deleteLeft())}</span>{' '}
                  unless kept.
                </div>
              </div>

              <div class="rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-4">
                <div class="text-xs text-gray-400 mb-1">
                  Keep it — {fmtAmount(result()!.keep.amount, result()!.keep.method)}/mo
                </div>
                <div class="text-xs text-gray-500">Pay to</div>
                <code class="block text-xs font-mono text-gray-300 break-all mt-0.5">
                  {result()!.keep.destination}
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Pay within the hour and this exact VM converts to a paid
                  subscription — no rebuild, same IP and data.
                </p>
              </div>
            </div>
          </Show>
        </Show>
      </div>

      <Show when={showSignIn()}>
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSignedIn={() => {
            setShowSignIn(false)
            launch()
          }}
        />
      </Show>
    </section>
  )
}

export default TrialSection
