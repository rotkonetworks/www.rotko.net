import { Component, createSignal, Show } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import Navigation from './Navigation'
import SignInModal from './SignInModal'
import { isSignedIn, identityLabel } from '../lib/auth'

const Header: Component = () => {
  const navigate = useNavigate()
  const [showSignIn, setShowSignIn] = createSignal(false)

  return (
    <header class="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <A href="/" class="flex items-center shrink-0">
            <img
              src="/images/rotko-logo.svg"
              alt="Rotko Networks"
              class="block w-auto h-8 max-h-8 object-contain"
            />
          </A>

          {/* Navigation + account */}
          <div class="flex items-center gap-4">
            <Navigation />
            <Show
              when={isSignedIn()}
              fallback={
                <button
                  onClick={() => setShowSignIn(true)}
                  class="px-3.5 py-1.5 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-cyan-600 hover:text-white transition-colors"
                >
                  Sign in
                </button>
              }
            >
              <A
                href="/dashboard"
                class="px-3.5 py-1.5 text-sm rounded-md bg-cyan-600/10 border border-cyan-700/50 text-cyan-300 hover:bg-cyan-600/20 transition-colors font-mono"
              >
                {identityLabel()}
              </A>
            </Show>
          </div>
        </div>
      </div>

      <Show when={showSignIn()}>
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSignedIn={() => { setShowSignIn(false); navigate('/dashboard') }}
        />
      </Show>
    </header>
  )
}

export default Header
