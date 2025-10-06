// src/components/TeamCard.tsx
import { Component, createSignal, createEffect, Show, For, onMount, onCleanup } from 'solid-js'
import type { TeamMember } from '../data/team-data'

interface TeamCardProps {
  member: TeamMember
  index: number
}

const TeamCard: Component<TeamCardProps> = (props) => {
  const [isFlipped, setIsFlipped] = createSignal(false)
  const [isVisible, setIsVisible] = createSignal(false)
  const [imageLoaded, setImageLoaded] = createSignal(false)

  // Use only cyan/turquoise color scheme for all cards
  const scheme = { fg: "#00ffff", dim: "#008888", bg: "#001111" }

  createEffect(() => {
    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.src = `/images/team/${props.member.image}`
    setIsVisible(true)
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === document.activeElement) {
      e.preventDefault()
      setIsFlipped(!isFlipped())
    } else if (e.key === 'Escape' && isFlipped()) {
      e.preventDefault()
      setIsFlipped(false)
    } else if (e.key === 'q' && isFlipped()) {
      e.preventDefault()
      setIsFlipped(false)
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div
      class="relative w-full h-[420px] cursor-pointer font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
      onClick={() => setIsFlipped(!isFlipped())}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsFlipped(!isFlipped())
        }
      }}
      tabindex="0"
      role="button"
      aria-label={`${props.member.name} - ${props.member.title}. Press Enter to flip card`}
      aria-pressed={isFlipped()}
    >
      <div
        class={`absolute inset-0 w-full h-full transition-all duration-100 ${
          isFlipped() ? 'opacity-0' : 'opacity-100'
        } ${isVisible() ? 'translate-y-0' : 'translate-y-4'}`}
        style={{
          "background-color": scheme.bg,
          "border": `1px solid ${scheme.fg}`,
          "color": scheme.fg
        }}
      >
        {/* front side - terminal window aesthetic */}
        <div class="flex flex-col h-full">
          {/* title bar with box drawing chars */}
          <div class="px-2 py-1 border-b" style={{ "border-color": scheme.fg }}>
            <div class="flex items-center justify-between">
              <span>┌─[{props.member.name}]</span>
              <span>@rotko─┐</span>
            </div>
          </div>

          {/* main content area */}
          <div class="flex-1 p-2 flex flex-col">
            {/* ascii-bordered image - square aspect ratio */}
            <div class="mb-2 flex justify-center">
              <div class="border relative w-48 h-48 max-w-full" style={{ "border-color": scheme.dim }}>
                <Show
                  when={imageLoaded()}
                  fallback={
                    <div class="w-full h-full flex items-center justify-center">
                      <span style={{ color: scheme.dim }}>[ loading... ]</span>
                    </div>
                  }
                >
                  <img
                    src={`/images/team/${props.member.image}`}
                    alt={props.member.name}
                    class="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "contrast(1.1) saturate(0.8)" }}
                  />
                </Show>
              </div>
            </div>

            {/* compact info block */}
            <div class="space-y-1 text-xs flex-1">
              <div class="flex">
                <span style={{ color: scheme.dim }}>role:</span>
                <span class="ml-2 truncate">{props.member.title}</span>
              </div>
              <div class="flex">
                <span style={{ color: scheme.dim }}>loc:</span>
                <span class="ml-2 truncate">{props.member.location}</span>
              </div>
              {/* terminal-style contact links */}
              <div class="flex items-center gap-3 mt-2 pt-1" style={{ "border-top": `1px solid ${scheme.dim}` }}>
                <Show when={props.member.github}>
                  <a
                    href={props.member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:underline"
                    style={{ color: scheme.dim }}
                    onClick={(e) => e.stopPropagation()}
                    title="GitHub"
                  >
                    gh
                  </a>
                </Show>
                <Show when={props.member.linkedin}>
                  <a
                    href={props.member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:underline"
                    style={{ color: scheme.dim }}
                    onClick={(e) => e.stopPropagation()}
                    title="LinkedIn"
                  >
                    li
                  </a>
                </Show>
              </div>
            </div>

            {/* prompt at bottom */}
            <div class="mt-auto pt-2 border-t" style={{ "border-color": scheme.dim }}>
              <span style={{ color: scheme.dim }}>&gt;&gt;&gt; </span>
              <span class="animate-pulse text-xs">cat profile.txt</span>
            </div>
          </div>
        </div>
      </div>

      {/* back side */}
      <div
        class={`absolute inset-0 w-full h-full transition-all duration-100 ${
          isFlipped() ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          "background-color": scheme.bg,
          "border": `1px solid ${scheme.fg}`,
          "color": scheme.fg
        }}
      >
        <div class="flex flex-col h-full font-mono text-xs">
          {/* header */}
          <div class="px-2 py-1 border-b" style={{ "border-color": scheme.fg }}>
            <div class="flex items-center justify-between">
              <span>┌─[profile.txt]</span>
              <span>({props.member.name})─┐</span>
            </div>
          </div>

          <div class="flex-1 p-3 overflow-y-auto space-y-3">
            {/* description as code block */}
            <div>
              <div style={{ color: scheme.dim }}>/* about */</div>
              <div class="pl-2 leading-relaxed whitespace-pre-wrap">
                {props.member.description}
              </div>
            </div>

            {/* social links */}
            <div class="mt-4">
              <div style={{ color: scheme.dim }}>/* links */</div>
              <div class="pl-2 space-y-1">
                <Show when={props.member.github}>
                  <a
                    href={props.member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ color: scheme.dim }}>github:</span>
                    <span class="ml-2">{props.member.github?.split('/').pop()}</span>
                  </a>
                </Show>
                <Show when={props.member.linkedin}>
                  <a
                    href={props.member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ color: scheme.dim }}>linkedin:</span>
                    <span class="ml-2">{props.member.linkedin?.split('/').pop()}</span>
                  </a>
                </Show>
              </div>
            </div>

            {/* setup config */}
            <div class="mt-4">
              <div style={{ color: scheme.dim }}>/* config */</div>
              <div class="pl-2 space-y-1">
                <For each={Object.entries(props.member.setup)}>
                  {([key, value]) => (
                    <div>
                      <span style={{ color: scheme.dim }}>{key}:</span>
                      <span class="ml-2">{value}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* prompt */}
          <div class="px-3 pb-3 border-t pt-2" style={{ "border-color": scheme.dim }}>
            <span style={{ color: scheme.dim }}>&gt;&gt;&gt; </span>
            <span class="animate-pulse">q to exit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamCard