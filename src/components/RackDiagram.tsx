import { Component, For, Show } from 'solid-js'
import { rackConfiguration } from '../data/rack-config'

const RackDiagram: Component = () => {
  const { rack_u, devices } = rackConfiguration
  const unit_height = 12

  return (
    <div class="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 max-w-md mx-auto lg:mx-0">
      <h3 class="text-xl font-bold mb-4 text-cyan-400 text-center">{rack_u}U Rack - Bangkok DC</h3>
      
      <div class="relative bg-gray-800 rounded p-2 overflow-hidden" style={{ height: `${rack_u * unit_height + 20}px` }}>
        {/* Empty U slots */}
        <For each={Array(rack_u).fill(0)}>
          {(_, i) => (
            <div 
              class="absolute left-2 right-2 border-b border-gray-700"
              style={{
                bottom: `${i() * unit_height}px`,
                height: `${unit_height}px`
              }}
            />
          )}
        </For>

        {/* Devices */}
        <For each={devices}>
          {(device) => (
            <div
              class="absolute left-2 right-2 flex items-center justify-center text-xs font-mono font-bold rounded group cursor-pointer"
              style={{
                bottom: `${(device.bottom_u - 1) * unit_height}px`,
                height: `${device.height_u * unit_height - 2}px`,
                "background-color": device.color,
                color: "#000"
              }}
            >
              <span class="truncate px-1">{device.name}</span>
              <Show when={device.details}>
                <div class="absolute hidden group-hover:block bg-black text-white p-2 rounded text-xs whitespace-nowrap z-10 bottom-full mb-1 left-1/2 transform -translate-x-1/2">
                  {device.details}
                </div>
              </Show>
            </div>
          )}
        </For>
        
        {/* U labels */}
        <For each={[1, 10, 20, 30, 40, 49]}>
          {(u) => (
            <div
              class="absolute -left-8 text-xs text-gray-500 font-mono"
              style={{ bottom: `${(u - 1) * unit_height}px` }}
            >
              U{u}
            </div>
          )}
        </For>
      </div>
      
      {/* Legend */}
      <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded" style="background-color: #66D9FF"></div>
          <span class="text-gray-400">Edge Routers</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded" style="background-color: #4DFFCC"></div>
          <span class="text-gray-400">Core Routers</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded" style="background-color: #00FFE5"></div>
          <span class="text-gray-400">Storage (EPYC)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded" style="background-color: #66FFB3"></div>
          <span class="text-gray-400">Validators</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded" style="background-color: #FFB366"></div>
          <span class="text-gray-400">Switches</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded" style="background-color: #FFE666"></div>
          <span class="text-gray-400">Uplink</span>
        </div>
      </div>
    </div>
  )
}

export default RackDiagram
