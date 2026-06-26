import { Component, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { footerData } from '../data/navigation-data'

const Footer: Component = () => {
  return (
    <footer class="bg-gray-900/40 border-t border-gray-800 mt-24">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div class="grid gap-10 md:grid-cols-5">
          {/* Brand column */}
          <div class="md:col-span-2">
            <img src="/images/rotko-logo.svg" alt="Rotko Networks" class="h-6 w-auto" />
            <p class="mt-4 text-sm text-gray-500 max-w-xs leading-relaxed">
              Bare-metal infrastructure on our own AS142108 in Bangkok, Thailand. No cloud, no markup.
            </p>
            <div class="mt-5 flex items-center gap-2">
              <For each={footerData.social}>
                {(s) => (
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    class="w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-gray-700 transition-colors"
                  >
                    <span class={`${s.icon} text-lg`} />
                  </a>
                )}
              </For>
            </div>
            <A href="/contact" class="mt-5 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300">
              Contact us →
            </A>
          </div>

          {/* Link sections */}
          <For each={footerData.sections}>
            {(section) => (
              <div>
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <ul class="space-y-2.5">
                  <For each={section.links}>
                    {(link) => (
                      <li>
                        <Show
                          when={link.external}
                          fallback={
                            <A href={link.href} class="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
                              {link.label}
                            </A>
                          }
                        >
                          <a href={link.href} target="_blank" rel="noopener noreferrer" class="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
                            {link.label}
                          </a>
                        </Show>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
        </div>

        <div class="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-3">
          <div class="text-sm text-gray-600">{footerData.copyright}</div>
          <div class="text-sm text-gray-600">{footerData.tagline}</div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
