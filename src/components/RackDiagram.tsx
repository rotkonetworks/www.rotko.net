import { Component, For, Show } from 'solid-js'
import { rackConfiguration } from '../data/rack-config'

const RackDiagram: Component = () => {
  const { rack_u, devices } = rackConfiguration
  const unit_height = 14 // Increased for better visibility

  // Generate all U numbers from 1 to rack_u
  const uNumbers = Array.from({ length: rack_u }, (_, i) => i + 1)

  return (
    <div class="w-full max-w-lg">
      <h3 class="text-xl font-bold mb-4 text-cyan-400 text-center">{rack_u}U Rack - Bangkok DC</h3>

      <div class="flex">
        {/* U Labels Column */}
        <div class="relative mr-2" style={{ height: `${rack_u * unit_height + 40}px`, width: '40px' }}>
          <For each={uNumbers}>
            {(u) => (
              <div
                class="absolute right-0 text-[10px] text-gray-500 font-mono"
                style={{
                  bottom: `${(u - 1) * unit_height + 20}px`,
                  height: `${unit_height}px`,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                U{u}
              </div>
            )}
          </For>
        </div>

        {/* Rack Frame */}
        <div class="flex-1">
          <div class="border-2 border-gray-600 bg-gray-950">
            {/* Rack Top */}
            <div class="h-5 bg-gray-800 border-b-2 border-gray-600 flex items-center justify-center">
              <div class="flex gap-2">
                <div class="w-2 h-2 bg-gray-600"></div>
                <div class="w-2 h-2 bg-gray-600"></div>
                <div class="w-2 h-2 bg-gray-600"></div>
                <div class="w-2 h-2 bg-gray-600"></div>
              </div>
            </div>

            {/* Rack Units */}
            <div class="relative bg-gray-900 overflow-hidden" style={{ height: `${rack_u * unit_height}px` }}>
              {/* U slot lines */}
              <For each={uNumbers}>
                {(u) => (
                  <div
                    class="absolute left-0 right-0 border-b border-gray-800"
                    style={{
                      bottom: `${(u - 1) * unit_height}px`,
                      height: `${unit_height}px`
                    }}
                  >
                    {/* Rack mounting holes */}
                    <div class="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gray-700"></div>
                    <div class="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gray-700"></div>
                  </div>
                )}
              </For>

              {/* Devices */}
              <For each={devices}>
                {(device) => (
                  <div
                    class="absolute left-2 right-2 group"
                    style={{
                      bottom: `${(device.bottom_u - 1) * unit_height}px`,
                      height: `${device.height_u * unit_height - 2}px`
                    }}
                  >
                    <div
                      class="w-full h-full flex items-center justify-center text-[11px] font-mono font-bold cursor-pointer border border-gray-700 hover:border-cyan-400 transition-colors"
                      style={{
                        "background-color": device.color,
                        color: "#000"
                      }}
                    >
                      <span class="truncate px-2">{device.name}</span>
                    </div>
                    {/* Tooltip */}
                    <Show when={device.details}>
                      <div class="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 pointer-events-none">
                        <div class="bg-black border border-cyan-400 px-2 py-1 text-xs text-white whitespace-nowrap">
                          {device.details}
                        </div>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>

            {/* Rack Bottom */}
            <div class="h-5 bg-gray-800 border-t-2 border-gray-600 flex items-center justify-center">
              <div class="flex gap-2">
                <div class="w-2 h-2 bg-gray-600"></div>
                <div class="w-2 h-2 bg-gray-600"></div>
                <div class="w-2 h-2 bg-gray-600"></div>
                <div class="w-2 h-2 bg-gray-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right U Labels Column (optional for symmetry) */}
        <div class="relative ml-2" style={{ height: `${rack_u * unit_height + 40}px`, width: '40px' }}>
          <For each={uNumbers}>
            {(u) => (
              <div
                class="absolute left-0 text-[10px] text-gray-500 font-mono"
                style={{
                  bottom: `${(u - 1) * unit_height + 20}px`,
                  height: `${unit_height}px`,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                U{u}
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Legend */}
      <div class="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 border border-gray-600" style="background-color: #66D9FF"></div>
          <span class="text-gray-400">Edge Routers</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 border border-gray-600" style="background-color: #4DFFCC"></div>
          <span class="text-gray-400">Core Routers</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 border border-gray-600" style="background-color: #00FFE5"></div>
          <span class="text-gray-400">Storage (EPYC)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 border border-gray-600" style="background-color: #66FFB3"></div>
          <span class="text-gray-400">Validators</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 border border-gray-600" style="background-color: #FFB366"></div>
          <span class="text-gray-400">Switches</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 border border-gray-600" style="background-color: #FFE666"></div>
          <span class="text-gray-400">Uplink</span>
        </div>
      </div>
    </div>
  )
}

export default RackDiagram