import { Component, For, Show, createSignal } from 'solid-js'
import { A, useLocation } from '@solidjs/router'
import { navigationData, NavItem } from '../data/navigation-data'

const Navigation: Component = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)

  const base = 'px-3 py-2 text-sm font-medium transition-colors duration-200'
  const isActive = (item: NavItem): boolean => {
    if (item.href) return location.pathname === item.href
    return !!item.children?.some((c) => c.href === location.pathname)
  }
  const linkClass = (item: NavItem) =>
    `${base} ${isActive(item) ? 'text-cyan-400' : 'text-gray-300 hover:text-cyan-400'}`

  return (
    <>
      {/* Desktop */}
      <nav class="hidden md:flex items-center gap-1">
        <For each={navigationData}>
          {(item) => (
            <Show
              when={item.children}
              fallback={<A href={item.href!} class={linkClass(item)}>{item.label}</A>}
            >
              {/* Dropdown */}
              <div class="relative group">
                <button class={`${linkClass(item)} inline-flex items-center gap-1`}>
                  {item.label}
                  <span class="i-mdi-chevron-down text-base transition-transform group-hover:rotate-180" />
                </button>
                {/* pt bridges the gap so hover doesn't drop */}
                <div class="absolute left-0 top-full pt-2 hidden group-hover:block">
                  <div class="min-w-[160px] rounded-lg border border-gray-800 bg-gray-900/95 backdrop-blur-md py-1 shadow-xl">
                    <For each={item.children}>
                      {(child) => (
                        <A
                          href={child.href!}
                          class={`block px-4 py-2 text-sm transition-colors ${
                            location.pathname === child.href ? 'text-cyan-400' : 'text-gray-300 hover:text-cyan-400 hover:bg-gray-800/60'
                          }`}
                        >
                          {child.label}
                        </A>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Show>
          )}
        </For>
      </nav>

      {/* Mobile toggle */}
      <button
        class="md:hidden p-2 text-gray-300 hover:text-cyan-400 transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
        aria-label="Toggle menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d={mobileMenuOpen() ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {/* Mobile menu */}
      <Show when={mobileMenuOpen()}>
        <div class="md:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
          <nav class="flex flex-col p-4">
            <For each={navigationData}>
              {(item) => (
                <Show
                  when={item.children}
                  fallback={
                    <A
                      href={item.href!}
                      onClick={() => setMobileMenuOpen(false)}
                      class={`py-3 text-sm font-medium ${location.pathname === item.href ? 'text-cyan-400' : 'text-gray-300'}`}
                    >
                      {item.label}
                    </A>
                  }
                >
                  <div class="py-2">
                    <div class="text-xs uppercase tracking-wider text-gray-500 py-1">{item.label}</div>
                    <For each={item.children}>
                      {(child) => (
                        <A
                          href={child.href!}
                          onClick={() => setMobileMenuOpen(false)}
                          class={`block py-2 pl-3 text-sm ${location.pathname === child.href ? 'text-cyan-400' : 'text-gray-300'}`}
                        >
                          {child.label}
                        </A>
                      )}
                    </For>
                  </div>
                </Show>
              )}
            </For>
          </nav>
        </div>
      </Show>
    </>
  )
}

export default Navigation
