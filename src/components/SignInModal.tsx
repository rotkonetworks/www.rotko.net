import { Component, createSignal, For, Show } from 'solid-js'
import {
  connectPolkadot,
  signInEthereum,
  signInSolana,
  startEmailLogin,
  type WalletAccount,
} from '../lib/auth'

const truncate = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a)

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

  // Polkadot multi-account picker: when the extension exposes more than one
  // account, list them and let the user pick which identity to sign in as.
  const [pkAccounts, setPkAccounts] = createSignal<WalletAccount[] | null>(null)
  const [pkSignIn, setPkSignIn] = createSignal<((address: string) => Promise<unknown>) | null>(null)

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

  const connectPk = async () => {
    setError('')
    setBusy('polkadot')
    try {
      const { accounts, signIn } = await connectPolkadot()
      if (accounts.length === 1) {
        await signIn(accounts[0].address)
        props.onSignedIn()
        return
      }
      // More than one — show the picker (keep signIn bound to this extension).
      setPkSignIn(() => signIn)
      setPkAccounts(accounts)
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed')
    } finally {
      setBusy(null)
    }
  }

  const pickPk = (address: string) => async () => {
    setError('')
    setBusy(address)
    try {
      await pkSignIn()!(address)
      props.onSignedIn()
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed')
    } finally {
      setBusy(null)
    }
  }

  const backToWallets = () => {
    setPkAccounts(null)
    setPkSignIn(null)
    setError('')
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
          <div class="flex items-center gap-2">
            <Show when={pkAccounts()}>
              <button
                onClick={backToWallets}
                disabled={!!busy()}
                aria-label="Back"
                class="text-gray-500 hover:text-white disabled:opacity-50"
              >
                ←
              </button>
            </Show>
            <h2 class="text-base font-semibold text-white">
              {pkAccounts() ? 'Choose account' : 'Sign in'}
            </h2>
          </div>
          <button onClick={props.onClose} aria-label="Close" class="text-gray-500 hover:text-white">✕</button>
        </div>

        <div class="p-6 space-y-3">
          <Show when={error()}>
            <div class="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{error()}</div>
          </Show>

          {/* Polkadot account picker */}
          <Show when={pkAccounts()}>
            <p class="text-xs text-gray-500">
              Your Polkadot wallet has multiple accounts. Pick the one to sign in with.
            </p>
            <For each={pkAccounts()!}>
              {(acct) => (
                <button class={walletBtn} disabled={!!busy()} onClick={pickPk(acct.address)}>
                  <span class="i-mdi-circle-multiple text-pink-400 text-xl" />
                  <span class="min-w-0">
                    <span class="block truncate text-gray-200">{acct.name || 'Account'}</span>
                    <span class="block font-mono text-xs text-gray-500">{truncate(acct.address)}</span>
                  </span>
                  <Show when={busy() === acct.address}>
                    <span class="ml-auto text-xs text-gray-500">Signing…</span>
                  </Show>
                </button>
              )}
            </For>
          </Show>

          {/* Wallet + email list */}
          <Show when={!pkAccounts()}>
            <Show
              when={!emailSent()}
              fallback={
                <div class="text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-md px-3 py-4 text-center">
                  Check your email for a sign-in link.
                </div>
              }
            >
              <button class={walletBtn} disabled={!!busy()} onClick={connectPk}>
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
          </Show>
        </div>
      </div>
    </div>
  )
}

export default SignInModal
