import { Component, createMemo, createSignal, Show } from 'solid-js'
import { resizeVm } from '../lib/auth'
import { hostingData as H } from '../data/hosting-data'

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`

interface Props {
  vmid: number
  /** Current specs (fallbacks applied when the VM object omits them). */
  current: { vcpu: number; ram_gb: number; disk_gb: number }
  /** Baseline monthly price ($/mo) shown as the "before" in the confirm step. */
  currentPrice: number
  onApplied?: () => void
}

// Client-side estimate for the live preview. The authoritative price comes back
// from the resize response; this only labels the sliders before Apply. Uses the
// dedicated-core rate as a conservative (higher) estimate since the class isn't
// carried on the VM object.
const estimate = (vcpu: number, ram_gb: number, disk_gb: number) => {
  const compute = vcpu * H.pricing.dedicatedCoreMonth
  const ram = ram_gb * H.pricing.ramGbMonth
  const extraDisk = Math.max(0, disk_gb - H.pricing.baseDiskGb) * (H.storage.perTbMonth / 1000)
  return compute + ram + extraDisk
}

// Resize / upgrade panel: steppers for vCPU / RAM / Disk (grow-only), a live
// price estimate, a confirm step against the backend-returned price, and
// success/error feedback. POSTs /v1/me/vms/:vmid/resize.
const ResizePanel: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [vcpu, setVcpu] = createSignal(props.current.vcpu)
  const [ram, setRam] = createSignal(props.current.ram_gb)
  const [disk, setDisk] = createSignal(props.current.disk_gb)

  // Confirm/apply lifecycle: idle → confirming → busy → done | error.
  const [phase, setPhase] = createSignal<'idle' | 'confirming' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = createSignal('')
  const [appliedPrice, setAppliedPrice] = createSignal<number | null>(null)

  const minDisk = () => props.current.disk_gb // grow-only
  const changed = () =>
    vcpu() !== props.current.vcpu ||
    ram() !== props.current.ram_gb ||
    disk() !== props.current.disk_gb

  const estPrice = createMemo(() => estimate(vcpu(), ram(), disk()))

  const stepVcpu = (d: number) => setVcpu((v) => Math.max(1, Math.min(64, v + d)))
  const stepRam = (d: number) => setRam((v) => Math.max(1, Math.min(512, v + d)))
  const stepDisk = (d: number) => setDisk((v) => Math.max(minDisk(), Math.min(8192, v + d)))

  const apply = async () => {
    setPhase('busy')
    setError('')
    try {
      const res = await resizeVm(props.vmid, {
        vcpu: vcpu(),
        ram_gb: ram(),
        disk_gb: disk(),
      })
      // Snap the UI to what the backend actually applied.
      setVcpu(res.applied.vcpu)
      setRam(res.applied.ram_gb)
      setDisk(res.applied.disk_gb)
      setAppliedPrice(res.price_usd_month)
      setPhase('done')
      props.onApplied?.()
    } catch (e: any) {
      setError(e?.message || 'Resize failed.')
      setPhase('error')
    }
  }

  const stepper = (
    label: string,
    value: () => number,
    step: (d: number) => void,
    unit: string,
    minLabel?: string,
  ) => (
    <div>
      <div class="text-xs text-gray-500 mb-1">{label}</div>
      <div class="flex items-center gap-2">
        <button
          onClick={() => step(-1)}
          disabled={phase() === 'busy'}
          class="w-7 h-7 rounded-md border border-gray-700 text-gray-300 hover:border-cyan-600 hover:text-cyan-300 disabled:opacity-40 transition-colors"
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <div class="min-w-[4.5rem] text-center font-mono text-sm text-white">
          {value()} <span class="text-gray-500">{unit}</span>
        </div>
        <button
          onClick={() => step(1)}
          disabled={phase() === 'busy'}
          class="w-7 h-7 rounded-md border border-gray-700 text-gray-300 hover:border-cyan-600 hover:text-cyan-300 disabled:opacity-40 transition-colors"
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
      <Show when={minLabel}>
        <div class="text-[10px] text-gray-600 mt-0.5">{minLabel}</div>
      </Show>
    </div>
  )

  return (
    <div class="mt-3">
      <Show
        when={open()}
        fallback={
          <button
            onClick={() => setOpen(true)}
            class="text-xs px-2.5 py-1 rounded-md border border-gray-700 text-gray-300 hover:border-cyan-600 hover:text-cyan-300 transition-colors"
          >
            Upgrade
          </button>
        }
      >
        <div class="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-semibold text-white">Resize VM {props.vmid}</div>
            <button
              onClick={() => { setOpen(false); setPhase('idle') }}
              class="text-gray-500 hover:text-white text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div class="flex flex-wrap gap-5">
            {stepper('vCPU', vcpu, stepVcpu, 'cores')}
            {stepper('RAM', ram, stepRam, 'GB')}
            {stepper('Disk', disk, stepDisk, 'GB', `grow-only · min ${minDisk()} GB`)}
          </div>

          <div class="mt-4 flex items-center justify-between text-sm">
            <span class="text-gray-400">
              Estimated{' '}
              <span class="font-mono text-white">{money(estPrice())}/mo</span>
              <span class="text-gray-600"> (final price confirmed on apply)</span>
            </span>
          </div>

          <Show when={phase() === 'error'}>
            <p class="mt-2 text-sm text-red-400">{error()}</p>
          </Show>

          {/* Success */}
          <Show when={phase() === 'done'}>
            <div class="mt-4 rounded-md border border-green-800/50 bg-green-950/20 px-3 py-2 text-sm text-green-300">
              Resized. New price:{' '}
              <span class="font-mono">
                {money(props.currentPrice)}/mo → {money(appliedPrice() ?? 0)}/mo
              </span>
            </div>
          </Show>

          {/* Confirm step */}
          <Show when={phase() === 'confirming' || phase() === 'busy'}>
            <div class="mt-4 rounded-md border border-cyan-800/50 bg-cyan-950/20 px-3 py-3">
              <p class="text-sm text-gray-200">
                Change monthly price{' '}
                <span class="font-mono text-white">
                  {money(props.currentPrice)}/mo → ~{money(estPrice())}/mo
                </span>
                ? Final price is confirmed by the server on apply.
              </p>
              <div class="mt-3 flex items-center gap-3">
                <button
                  onClick={apply}
                  disabled={phase() === 'busy'}
                  class="px-4 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors"
                >
                  {phase() === 'busy' ? 'Applying…' : 'Confirm resize'}
                </button>
                <button
                  onClick={() => setPhase('idle')}
                  disabled={phase() === 'busy'}
                  class="text-xs text-gray-500 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Show>

          {/* Initial apply trigger */}
          <Show when={phase() === 'idle' || phase() === 'error'}>
            <div class="mt-4 flex items-center gap-3">
              <button
                onClick={() => setPhase('confirming')}
                disabled={!changed()}
                class="px-4 py-2 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors"
              >
                Review change
              </button>
              <Show when={!changed()}>
                <span class="text-xs text-gray-600">No changes yet.</span>
              </Show>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export default ResizePanel
