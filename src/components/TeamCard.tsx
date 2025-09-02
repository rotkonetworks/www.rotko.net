// src/components/TeamCard.tsx
import { Component, createSignal, createEffect, Show, For } from 'solid-js'
import type { TeamMember } from '../data/team-data'

interface TeamCardProps {
  member: TeamMember
  index: number
}

const TeamCard: Component<TeamCardProps> = (props) => {
  const [isFlipped, setIsFlipped] = createSignal(false)
  const [isVisible, setIsVisible] = createSignal(false)
  const [imageLoaded, setImageLoaded] = createSignal(false)
  
  // Demoscene color schemes for each card
  const colorSchemes = [
    { primary: "#ff0080", secondary: "#00ff80", accent: "#8000ff", bg: "rgba(255, 0, 128, 0.1)" },
    { primary: "#00ffff", secondary: "#ff8000", accent: "#ff0040", bg: "rgba(0, 255, 255, 0.1)" },
    { primary: "#80ff00", secondary: "#ff4080", accent: "#4080ff", bg: "rgba(128, 255, 0, 0.1)" },
    { primary: "#ff4000", secondary: "#00ff40", accent: "#4000ff", bg: "rgba(255, 64, 0, 0.1)" },
    { primary: "#ff8040", secondary: "#40ff80", accent: "#8040ff", bg: "rgba(255, 128, 64, 0.1)" },
    { primary: "#4080ff", secondary: "#ff8040", accent: "#80ff40", bg: "rgba(64, 128, 255, 0.1)" },
  ]

  const scheme = colorSchemes[props.index % colorSchemes.length]

  // Setup icons
  const getSetupIcon = (type: string) => {
    switch (type) {
      case "editor": return "⌨"
      case "os": return "💻"
      case "de": return "🏢"
      case "shell": return "🐚"
      default: return "⌨"
    }
  }

  createEffect(() => {
    // Preload image
    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.src = `/images/team/${props.member.image}`

    // Staggered entrance animation
    setTimeout(() => setIsVisible(true), props.index * 100)
  })

  return (
    <div 
      class="relative w-full h-[520px] cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped())}
    >
      <div 
        class={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped() ? 'rotate-y-180' : ''
        } ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{
          "border-color": scheme.primary,
          "box-shadow": `0 0 20px ${scheme.primary}40`,
          "border-width": "2px",
          "border-style": "solid",
          "border-radius": "0.5rem",
          "background-color": "#00181e"
        }}
      >
        {/* Front Side */}
        <div 
          class="absolute inset-0 w-full h-full backface-hidden flex flex-col"
          style={{ "backface-visibility": "hidden" }}
        >
          {/* Header */}
          <div 
            class="relative h-14 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(90deg, ${scheme.primary}, ${scheme.secondary})` 
            }}
          >
            <h3 class="text-lg font-bold text-black tracking-wider font-mono">
              {props.member.name.toUpperCase()}
            </h3>
          </div>

          {/* Content */}
          <div class="relative flex-1 p-4 flex flex-col items-center">
            {/* Portrait */}
            <div 
              class="relative w-48 h-48 rounded-lg overflow-hidden border-2 mb-3"
              style={{ 
                "border-color": scheme.secondary,
                "box-shadow": `0 0 15px ${scheme.secondary}60` 
              }}
            >
              <Show 
                when={imageLoaded()} 
                fallback={
                  <div class="w-full h-full bg-gray-600/30 rounded-lg flex items-center justify-center">
                    <div class="text-gray-400 text-sm font-mono">Loading...</div>
                  </div>
                }
              >
                <img 
                  src={`/images/team/${props.member.image}`}
                  alt={props.member.name}
                  class="w-full h-full object-cover"
                />
              </Show>
              {/* CRT effect */}
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-10" />
            </div>

            {/* Title and Location */}
            <div class="text-center space-y-2 mb-3">
              <div 
                class="text-xs px-2 py-1 border-0 font-mono tracking-wider"
                style={{ 
                  "background-color": scheme.accent,
                  "color": "#000" 
                }}
              >
                {props.member.title.toUpperCase()}
              </div>
              <div class="flex items-center justify-center space-x-2 text-sm">
                <span style={{ color: scheme.primary }}>📍</span>
                <span style={{ color: scheme.primary }} class="font-mono">
                  {props.member.location}
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div class="flex justify-center space-x-3 mb-3">
              <Show when={props.member.github}>
                <a
                  href={props.member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-3 rounded-lg transition-transform hover:scale-110"
                  style={{
                    "background-color": scheme.bg,
                    "color": scheme.primary,
                    "border": `1px solid ${scheme.primary}`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span class="text-lg">🔗</span>
                </a>
              </Show>
              <Show when={props.member.linkedin}>
                <a
                  href={props.member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-3 rounded-lg transition-transform hover:scale-110"
                  style={{
                    "background-color": scheme.bg,
                    "color": scheme.secondary,
                    "border": `1px solid ${scheme.secondary}`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span class="text-lg">💼</span>
                </a>
              </Show>
            </div>

            {/* Flip indicator */}
            <div class="mt-auto text-center">
              <div 
                class="text-xs font-mono tracking-wider"
                style={{ color: scheme.secondary }}
              >
                [CLICK TO VIEW PROFILE]
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          class="absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-4 flex flex-col"
          style={{ "backface-visibility": "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Header */}
          <div class="text-center mb-4">
            <h3 
              class="text-lg font-bold font-mono tracking-wider"
              style={{ color: scheme.primary }}
            >
              {props.member.name.toUpperCase()}
            </h3>
            <div 
              class="text-sm font-mono"
              style={{ color: scheme.secondary }}
            >
              SYSTEM.PROFILE
            </div>
          </div>

          {/* Description */}
          <div class="flex-1 space-y-3">
            <div 
              class="text-sm leading-relaxed font-mono p-3 rounded border h-44 overflow-y-auto"
              style={{
                color: "#e0e0e0",
                "background-color": scheme.bg,
                "border-color": scheme.primary
              }}
            >
              {props.member.description}
            </div>

            {/* Setup */}
            <div class="space-y-2">
              <div 
                class="text-sm font-mono font-bold tracking-wider"
                style={{ color: scheme.accent }}
              >
                SYSTEM.CONFIG
              </div>
              <div class="grid grid-cols-2 gap-2">
                <For each={Object.entries(props.member.setup)}>
                  {([key, value]) => (
                    <div 
                      class="flex items-center space-x-2 p-2 rounded text-xs font-mono border"
                      style={{
                        "background-color": "rgba(0, 0, 0, 0.3)",
                        "border-color": scheme.secondary
                      }}
                    >
                      <div style={{ color: scheme.secondary }}>
                        {getSetupIcon(key)}
                      </div>
                      <div class="flex-1">
                        <div class="text-gray-400 text-xs">{key.toUpperCase()}</div>
                        <div 
                          style={{ color: scheme.primary }}
                          class="font-bold text-xs"
                        >
                          {value}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Back indicator */}
          <div class="mt-3 text-center">
            <div 
              class="text-xs font-mono tracking-wider"
              style={{ color: scheme.secondary }}
            >
              [CLICK TO RETURN]
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamCard
