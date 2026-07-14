import { Component, createSignal, Show } from 'solid-js'
import { Vm, VmStatus, startVm, stopVm, rebootVm } from '../lib/auth'
import CopyCmd from './CopyCmd'
import ResizePanel from './ResizePanel'

interface Props {
  vm: Vm
  /** Monthly price for this VM ($/mo), when known from the subscription. */
  price?: number
  /** Called after any state-changing action so the parent can refetch. */
  onChanged?: () => void
}

type Action = 'start' | 'stop' | 'reboot'

const specFmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))
const money = (n: number) => '$' + (Number.isInteger(n) ? n : n.toFixed(2))

// Data-dense per-VM card (Hetzner-cloud style): status pill, specs row, an
// access block (copyable SSH strings), and lifecycle actions with confirm +
// optimistic status. Reuses CopyCmd and ResizePanel.
const VmCard: Component<Props> = (props) => {
  // Optimistic local status overlays the server value until the next refetch.
  const [optStatus, setOptStatus] = createSignal<VmStatus | null>(null)
  const status = () => optStatus() ?? props.vm.status

  const [busy, setBusy] = createSignal<Action | null>(null)
  const [confirm, setConfirm] = createSignal<Action | null>(null)
  const [error, setError] = createSignal('')

  const run = async (action: Action) => {
    setConfirm(null)
    setBusy(action)
    setError('')
    // Optimistic: reflect the intended end-state immediately.
    setOptStatus(action === 'stop' ? 'stopped' : 'running')
    try {
      const res =
        action === 'start' ? await startVm(props.vm.vmid)
        : action === 'stop' ? await stopVm(props.vm.vmid)
        : await rebootVm(props.vm.vmid)
      setOptStatus(res.status)
      props.onChanged?.()
    } catch (e: any) {
      setOptStatus(null) // roll back
      setError(e?.message || `Failed to ${action} VM.`)
    } finally {
      setBusy(null)
    }
  }

  const running = () => status() === 'running'

  const actionLabel: Record<Action, string> = {
    start: 'Start',
    stop: 'Stop',
    reboot: 'Reboot',
  }

  const gwCmd = () => props.vm.ssh_gateway?.command

  return (
    <div class="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
      {/* Header: name + status pill */}
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <span
            class="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium"
            classList={{
              'border-green-700 text-green-400 bg-green-950/30': running(),
              'border-gray-700 text-gray-400 bg-gray-950/40': !running(),
            }}
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              classList={{ 'bg-green-400': running(), 'bg-gray-500': !running() }}
            />
            {running() ? 'running' : 'stopped'}
          </span>
          <div class="min-w-0">
            <div class="text-white font-semibold truncate">{props.vm.name}</div>
            <div class="text-xs text-gray-500 font-mono">VM {props.vm.vmid}</div>
          </div>
        </div>
        <Show when={props.price != null}>
          <span class="font-mono text-sm text-gray-300 shrink-0">{money(props.price!)}/mo</span>
        </Show>
      </div>

      {/* Specs row */}
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-mono">
        <span>{specFmt(props.vm.vcpu)} vCPU</span>
        <span class="text-gray-700">·</span>
        <span>{specFmt(props.vm.ram_gb)} GB RAM</span>
        <span class="text-gray-700">·</span>
        <span>{specFmt(props.vm.disk_gb)} GB disk</span>
        <span class="text-gray-700">·</span>
        <span class="text-gray-500">{props.vm.location}</span>
        <span class="text-gray-700">·</span>
        <span class="text-gray-600">{props.vm.node}</span>
      </div>

      {/* Traffic / usage */}
      <Show when={props.vm.traffic}>
        {(t) => (
          <div class="mt-2 text-xs text-gray-500 font-mono">
            Traffic: p95 {specFmt(t().p95_mbps)} / peak {specFmt(t().peak_mbps)} Mbps · commit {specFmt(t().commit_mbps)} Mbps
            <Show when={t().over_commit}>
              {' '}<span class="text-amber-400">(over commit)</span>
            </Show>
          </div>
        )}
      </Show>

      {/* Access block */}
      <div class="mt-4 rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-2">
        <div class="text-xs text-gray-500">Access · IPv6</div>
        <CopyCmd cmd={`ssh hermes@${props.vm.ipv6}`} />
        <Show when={props.vm.ipv4}>
          <div class="text-xs text-gray-500 pt-1">Access · IPv4</div>
          <CopyCmd cmd={`ssh hermes@${props.vm.ipv4}`} />
        </Show>
        <Show when={gwCmd()}>
          <div class="text-xs text-gray-500 pt-1">SSH from any network (IPv4 gateway)</div>
          <CopyCmd cmd={gwCmd()!} />
        </Show>
      </div>

      {/* Actions row */}
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`/console/${props.vm.vmid}`}
          class="text-xs px-2.5 py-1.5 rounded-md border border-cyan-700/60 text-cyan-300 hover:bg-cyan-600/15 transition-colors"
        >
          Console →
        </a>

        <Show when={!running()}>
          <button
            onClick={() => setConfirm('start')}
            disabled={busy() !== null}
            class="text-xs px-2.5 py-1.5 rounded-md border border-green-700/60 text-green-300 hover:bg-green-600/15 disabled:opacity-50 transition-colors"
          >
            {busy() === 'start' ? 'Starting…' : 'Start'}
          </button>
        </Show>
        <Show when={running()}>
          <button
            onClick={() => setConfirm('reboot')}
            disabled={busy() !== null}
            class="text-xs px-2.5 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:border-cyan-600 hover:text-cyan-300 disabled:opacity-50 transition-colors"
          >
            {busy() === 'reboot' ? 'Rebooting…' : 'Reboot'}
          </button>
          <button
            onClick={() => setConfirm('stop')}
            disabled={busy() !== null}
            class="text-xs px-2.5 py-1.5 rounded-md border border-red-800/60 text-red-300 hover:bg-red-600/15 disabled:opacity-50 transition-colors"
          >
            {busy() === 'stop' ? 'Stopping…' : 'Stop'}
          </button>
        </Show>
      </div>

      {/* Confirm step */}
      <Show when={confirm()}>
        {(c) => (
          <div class="mt-3 rounded-md border border-cyan-800/50 bg-cyan-950/20 px-3 py-3 text-sm">
            <p class="text-gray-200">
              {actionLabel[c()]} VM{' '}
              <span class="font-mono text-white">{props.vm.name}</span> (VM {props.vm.vmid})?
            </p>
            <div class="mt-3 flex items-center gap-3">
              <button
                onClick={() => run(c())}
                class="px-3.5 py-1.5 text-xs rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Confirm {actionLabel[c()].toLowerCase()}
              </button>
              <button
                onClick={() => setConfirm(null)}
                class="text-xs text-gray-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Show>

      <Show when={error()}>
        <p class="mt-2 text-sm text-red-400">{error()}</p>
      </Show>

      {/* Upgrade / resize */}
      <ResizePanel
        vmid={props.vm.vmid}
        current={{ vcpu: props.vm.vcpu, ram_gb: props.vm.ram_gb, disk_gb: props.vm.disk_gb }}
        currentPrice={props.price ?? 0}
        onApplied={props.onChanged}
      />

      {/* Managed access note */}
      <p class="mt-3 text-[11px] text-gray-600 leading-relaxed">
        Managed access: Rotko can access this VM for support and maintenance — the
        provider key is installed alongside your own.
      </p>
    </div>
  )
}

export default VmCard
