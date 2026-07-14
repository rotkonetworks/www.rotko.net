import { Component, createSignal, createResource, For, Show, onCleanup } from 'solid-js'
import {
  session,
  isSignedIn,
  getNotifications,
  markNotificationsRead,
  type Notification,
} from '../lib/auth'

/** Compact "3m ago" / "2h ago" / "5d ago" from an RFC3339 timestamp. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(then).toLocaleDateString()
}

/**
 * Notifications bell for the dashboard header: an unread badge plus a dropdown
 * list. Opening the dropdown marks the currently-visible unread items read and
 * refreshes the count. Polls on mount and every 60s while signed in.
 */
const NotificationBell: Component = () => {
  const [open, setOpen] = createSignal(false)
  const [items, { refetch }] = createResource<Notification[]>(session, () =>
    isSignedIn() ? getNotifications() : Promise.resolve([]),
  )

  const unread = () => (items() ?? []).filter((n) => !n.read).length

  // Poll while mounted (dashboard is long-lived); also refetched after actions.
  const timer = setInterval(() => {
    if (isSignedIn()) refetch()
  }, 60_000)
  onCleanup(() => clearInterval(timer))

  const toggle = async () => {
    const next = !open()
    setOpen(next)
    if (next) {
      // Mark the currently-visible unread items read, then refresh the count.
      const ids = (items() ?? []).filter((n) => !n.read).map((n) => n.id)
      if (ids.length) {
        try {
          await markNotificationsRead(ids)
        } catch {
          /* best-effort — the feed still shows them */
        }
        refetch()
      }
    }
  }

  return (
    <div class="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        class="relative p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
      >
        {/* bell glyph (inline SVG — no asset deps) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m6.714 0a3 3 0 1 1-6.714 0m6.714 0a24.255 24.255 0 0 1-6.714 0"
          />
        </svg>
        <Show when={unread() > 0}>
          <span class="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center text-[0.65rem] font-semibold rounded-full bg-cyan-600 text-white">
            {unread() > 9 ? '9+' : unread()}
          </span>
        </Show>
      </button>

      <Show when={open()}>
        {/* click-away backdrop */}
        <div class="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div class="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
          <div class="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-white">
            Notifications
          </div>
          <Show
            when={(items() ?? []).length}
            fallback={
              <div class="px-4 py-6 text-sm text-gray-500">
                <Show when={!items.loading} fallback={<p>Loading…</p>}>
                  <p>You're all caught up.</p>
                </Show>
              </div>
            }
          >
            <ul class="divide-y divide-gray-800">
              <For each={items()}>
                {(n) => (
                  <li class="px-4 py-3 flex gap-3">
                    <span
                      class="mt-1.5 shrink-0 w-2 h-2 rounded-full"
                      classList={{
                        'bg-cyan-500': !n.read,
                        'bg-transparent': n.read,
                      }}
                    />
                    <div class="min-w-0">
                      <div class="text-sm text-gray-100">{n.title}</div>
                      <div class="text-xs text-gray-400 mt-0.5 break-words">{n.body}</div>
                      <div class="text-[0.7rem] text-gray-600 mt-1">
                        {relativeTime(n.created_at)}
                      </div>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export default NotificationBell
