import { Component, For, createSignal } from 'solid-js'
import { A, useLocation } from '@solidjs/router'
import { navigationData } from '../data/navigation-data'
import WirssiChat from './WirssiChat'

const Navigation: Component = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)
  const [chatOpen, setChatOpen] = createSignal(false)
  
  const navClass = 'px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50'
  const activeClass = 'px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md text-cyan-400 bg-cyan-400/10'
  
  const getClass = (href: string) => location.pathname === href ? activeClass : navClass

  return (
    <>
      <nav class="hidden md:flex items-center space-x-1">
        <For each={navigationData}>
          {(item) => 
            item.label === 'Contact' 
              ? <a href="#" onClick={(e) => { e.preventDefault(); setChatOpen(true) }} class={navClass}>{item.label}</a>
              : <A href={item.href} class={getClass(item.href)}>{item.label}</A>
          }
        </For>
      </nav>

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
            d={mobileMenuOpen() ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {mobileMenuOpen() && (
        <div class="md:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
          <nav class="flex flex-col p-4">
            <For each={navigationData}>
              {(item) => 
                item.label === 'Contact'
                  ? <a 
                      href="#"
                      onClick={(e) => { e.preventDefault(); setChatOpen(true); setMobileMenuOpen(false) }}
                      class={`${navClass} py-3 block`}>
                      {item.label}
                    </a>
                  : <A 
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      class={`${getClass(item.href)} py-3`}>
                      {item.label}
                    </A>
              }
            </For>
          </nav>
        </div>
      )}

      {chatOpen() && (
        <WirssiChat 
          server="wss://irc.rotko.net/webirc"
          channel="#rotko"
          position="bottom-right"
        />
      )}
    </>
  )
}

export default Navigation
