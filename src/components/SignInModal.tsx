import { Component, createSignal, Show } from 'solid-js'
import {
  signInPolkadot,
  signInEthereum,
  signInSolana,
  startEmailLogin,
} from '../lib/auth'

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

interface Props {
  onClose: () => void
  onSignedIn: () => void
}

// Sign-in modal: Polkadot / Ethereum / Solana wallets + email magic-link.
const SignInModal: Component<Props> = (props) => {
  const [busy, setBusy] = createSignal<string | null>(null)
  const [error, setError] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [emailSent, setEmailSent] = createSignal(false)

  const wallet = (id: string, fn: () => Promise<unknown>) => async () => {
    setError('')
    setBusy(id)
    try {
      await fn()
      props.onSignedIn()
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed')
    } finally {
      setBusy(null)
    }
  }

  const sendEmail = async (e: Event) => {
    e.preventDefault()
    if (!emailOk(email())) return setError('Enter a valid email')
    setError('')
    setBusy('email')
    try {
      await startEmailLogin(email())
      setEmailSent(true)
    } catch (e: any) {
      setError(e?.message ?? 'Could not send link')
    } finally {
      setBusy(null)
    }
  }

  const walletBtn =
    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-700 bg-gray-900 hover:border-cyan-600 hover:bg-gray-900/60 text-left text-sm text-gray-200 transition-colors disabled:opacity-50'
  const field =
    'w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-600 outline-none transition-colors'

  return (
    <div
      class="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={props.onClose}
    >
      <div
        class="w-full max-w-sm my-8 rounded-xl border border-gray-700 bg-gray-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 class="text-base font-semibold text-white">Sign in</h2>
          <button onClick={props.onClose} aria-label="Close" class="text-gray-500 hover:text-white">✕</button>
        </div>

        <div class="p-6 space-y-3">
          <Show when={error()}>
            <div class="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{error()}</div>
          </Show>

          <Show
            when={!emailSent()}
            fallback={
              <div class="text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-md px-3 py-4 text-center">
                Check your email for a sign-in link.
              </div>
            }
          >
            <button class={walletBtn} disabled={!!busy()} onClick={wallet('polkadot', signInPolkadot)}>
              <span class="i-mdi-circle-multiple text-pink-400 text-xl" />
              <span>{busy() === 'polkadot' ? 'Connecting…' : 'Polkadot wallet'}</span>
            </button>
            <button class={walletBtn} disabled={!!busy()} onClick={wallet('ethereum', signInEthereum)}>
              <span class="i-mdi-ethereum text-indigo-300 text-xl" />
              <span>{busy() === 'ethereum' ? 'Connecting…' : 'Ethereum wallet'}</span>
            </button>
            <button class={walletBtn} disabled={!!busy()} onClick={wallet('solana', signInSolana)}>
              <span class="i-mdi-flash text-teal-300 text-xl" />
              <span>{busy() === 'solana' ? 'Connecting…' : 'Solana wallet'}</span>
            </button>

            <div class="flex items-center gap-3 py-1">
              <div class="h-px flex-1 bg-gray-800" />
              <span class="text-xs text-gray-600">or</span>
              <div class="h-px flex-1 bg-gray-800" />
            </div>

            <form onSubmit={sendEmail} class="space-y-2">
              <input
                class={field}
                type="email"
                placeholder="you@email.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
              <button
                type="submit"
                disabled={!!busy()}
                class="w-full px-4 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
              >
                {busy() === 'email' ? 'Sending…' : 'Email me a link'}
              </button>
            </form>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default SignInModal
