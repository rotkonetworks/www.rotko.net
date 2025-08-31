import { Component, For } from 'solid-js'
import { siteData } from '../data/site-data'

interface HeaderProps {
  onChatToggle: () => void
}

const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="border-b border-gray-8 sticky top-0 bg-black/95 backdrop-blur z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <a href="/" class="flex items-center space-x-2">
              <div class="text-cyan-3 text-2xl font-bold font-mono">ROTKO</div>
              <div class="hidden sm:block text-gray-5 text-xs">AS142108</div>
            </a>
          </div>

          <nav class="flex items-center space-x-6">
            <For each={siteData.navigation}>
              {(item) => (
                <a 
                  href={item.href}
                  class="text-gray-4 hover:text-cyan-3 transition-colors text-sm font-mono"
                >
                  {item.label}
                </a>
              )}
            </For>
            <button
              onClick={props.onChatToggle}
              class="text-gray-4 hover:text-cyan-3 transition-colors text-sm font-mono"
            >
              IRC
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
