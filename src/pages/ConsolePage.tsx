import { Component, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { isSignedIn, openVmConsole } from '../lib/auth'
import TerminalConsole from '../components/TerminalConsole'

// In-browser SSH console: an xterm.js terminal wired to the HermesHost
// websocket bridge (/v1/me/vms/:vmid/console).
const ConsolePage: Component = () => {
  const params = useParams()

  return (
    <div class="max-w-5xl mx-auto px-6 lg:px-12 py-10">
      <h1 class="text-lg font-semibold text-white mb-3">Console — VM {params.vmid}</h1>
      <Show
        when={isSignedIn()}
        fallback={<p class="text-gray-400">Sign in to open a console.</p>}
      >
        <TerminalConsole url={openVmConsole(params.vmid)} />
        <p class="mt-3 text-xs text-gray-600">
          Secure shell tunnelled over a websocket to your VM. Keystrokes never leave the session.
        </p>
      </Show>
    </div>
  )
}

export default ConsolePage
