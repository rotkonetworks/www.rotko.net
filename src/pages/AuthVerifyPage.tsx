import { Component, createSignal, onMount, Show } from 'solid-js'
import { useNavigate, useSearchParams } from '@solidjs/router'
import { verifyEmailToken } from '../lib/auth'

// Magic-link callback: /auth/verify?token=… — verifies the emailed token and
// drops the user into the control panel.
const AuthVerifyPage: Component = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = createSignal('')

  onMount(async () => {
    const token = params.token
    if (!token || Array.isArray(token)) {
      setError('Missing sign-in token.')
      return
    }
    try {
      await verifyEmailToken(token)
      navigate('/dashboard', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'This sign-in link is invalid or expired.')
    }
  })

  return (
    <div class="max-w-md mx-auto px-6 py-24 text-center">
      <Show
        when={error()}
        fallback={<p class="text-gray-400">Signing you in…</p>}
      >
        <p class="text-red-400">{error()}</p>
        <a href="/dashboard" class="mt-4 inline-block text-cyan-400 hover:text-cyan-300 text-sm">
          Back to sign in
        </a>
      </Show>
    </div>
  )
}

export default AuthVerifyPage
