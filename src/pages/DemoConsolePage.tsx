import { Component, Show } from 'solid-js'
import { isSignedIn, openDemoConsole } from '../lib/auth'
import TerminalConsole from '../components/TerminalConsole'

// Demo web shell: a shared, ephemeral sandbox terminal for signed-in users to
// try a live shell in the browser without provisioning a VM. Autoconnects on
// mount to /v1/me/console/demo.
const DemoConsolePage: Component = () => {
  return (
    <div class="max-w-5xl mx-auto px-6 lg:px-12 py-10">
      <div class="flex items-center gap-2 mb-1">
        <span class="i-mdi-console-line text-cyan-400 text-xl" />
        <h1 class="text-lg font-semibold text-white">Live demo shell</h1>
      </div>
      <p class="text-sm text-gray-400 mb-4 max-w-2xl">
        A sandboxed shell running on our Bangkok fleet — try it right in your
        browser. This is a shared demo environment, not your own VM.
      </p>
      <Show
        when={isSignedIn()}
        fallback={<p class="text-gray-400">Sign in to open the demo shell.</p>}
      >
        <TerminalConsole url={openDemoConsole()} />
        <p class="mt-3 text-xs text-gray-600">
          Ephemeral sandbox. Deploy your own VM for a persistent environment.
        </p>
      </Show>
    </div>
  )
}

export default DemoConsolePage
