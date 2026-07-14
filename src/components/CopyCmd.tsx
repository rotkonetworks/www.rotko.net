import { Component, createSignal } from 'solid-js'

interface Props {
  cmd: string
}

// Monospace command with a click-to-copy affordance. Used for SSH connection
// strings on the trial card and the dashboard VM view.
const CopyCmd: Component<Props> = (props) => {
  const [copied, setCopied] = createSignal(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.cmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  }

  return (
    <div class="flex items-center gap-2">
      <code class="flex-1 block text-sm font-mono text-cyan-300 break-all">{props.cmd}</code>
      <button
        onClick={copy}
        aria-label="Copy command"
        class="shrink-0 text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-400 hover:border-cyan-600 hover:text-cyan-300 transition-colors"
      >
        {copied() ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default CopyCmd
