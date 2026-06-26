import { Component, onCleanup, onMount, createSignal, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { session, isSignedIn } from '../lib/auth'

const WS_BASE = (import.meta.env.VITE_API_URL || '')
  .replace(/^http/, 'ws')
  .replace(/\/+$/, '')

// In-browser SSH console: an xterm.js terminal wired to the HermesHost
// websocket bridge (/v1/me/vms/:vmid/console). Keystrokes → ws → ssh stdin;
// ssh stdout → ws → terminal.
const ConsolePage: Component = () => {
  const params = useParams()
  let host!: HTMLDivElement
  const [status, setStatus] = createSignal('connecting')

  onMount(() => {
    if (!isSignedIn()) {
      setStatus('not signed in')
      return
    }
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      theme: { background: '#0a0e14', foreground: '#e6e9ee', cursor: '#22d3ee' },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    fit.fit()
    term.focus()

    const url = `${WS_BASE}/v1/me/vms/${params.vmid}/console?token=${session()!.token}`
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => setStatus('connected')
    ws.onmessage = (e) => {
      const data =
        typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data as ArrayBuffer)
      term.write(data)
    }
    ws.onclose = () => { setStatus('disconnected'); term.write('\r\n\x1b[31m[session closed]\x1b[0m\r\n') }
    ws.onerror = () => setStatus('error')

    // Send keystrokes to the remote shell.
    term.onData((d) => { if (ws.readyState === WebSocket.OPEN) ws.send(d) })

    const onResize = () => fit.fit()
    window.addEventListener('resize', onResize)
    onCleanup(() => {
      window.removeEventListener('resize', onResize)
      ws.close()
      term.dispose()
    })
  })

  return (
    <div class="max-w-5xl mx-auto px-6 lg:px-12 py-10">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-lg font-semibold text-white">Console — VM {params.vmid}</h1>
        <span
          class="text-xs px-2 py-0.5 rounded-full border"
          classList={{
            'border-green-700 text-green-400': status() === 'connected',
            'border-gray-700 text-gray-400': status() !== 'connected',
          }}
        >
          {status()}
        </span>
      </div>
      <Show
        when={isSignedIn()}
        fallback={<p class="text-gray-400">Sign in to open a console.</p>}
      >
        <div
          ref={host}
          class="rounded-lg border border-gray-800 bg-[#0a0e14] p-2"
          style={{ height: '70vh' }}
        />
        <p class="mt-3 text-xs text-gray-600">
          Secure shell tunnelled over a websocket to your VM. Keystrokes never leave the session.
        </p>
      </Show>
    </div>
  )
}

export default ConsolePage
