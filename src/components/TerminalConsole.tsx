import { Component, onCleanup, onMount, createSignal } from 'solid-js'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface Props {
  /** Full ws:// URL (including ?token=) to connect to. */
  url: string
  /** Optional height for the terminal host (default 70vh). */
  height?: string
}

// Shared xterm.js terminal wired to a HermesHost websocket bridge. Keystrokes
// → ws → ssh stdin; ssh stdout → ws → terminal. Both the per-VM console and the
// demo web shell mount this with different ws URLs.
const TerminalConsole: Component<Props> = (props) => {
  let host!: HTMLDivElement
  const [status, setStatus] = createSignal('connecting')

  onMount(() => {
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

    const ws = new WebSocket(props.url)
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
    <div>
      <div class="flex justify-end mb-2">
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
      <div
        ref={host}
        class="rounded-lg border border-gray-800 bg-[#0a0e14] p-2"
        style={{ height: props.height ?? '70vh' }}
      />
    </div>
  )
}

export default TerminalConsole
