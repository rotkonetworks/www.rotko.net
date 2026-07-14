import { Component, For, createResource } from 'solid-js'
import { infrastructureData } from '../data/infrastructure-data'
import { fetchFleetUptime30d } from '../services/gatus-service'

const InfrastructureStats: Component = () => {
 // Live 30-day median uptime from status.rotko.net; static value is the fallback.
 const [liveUptime] = createResource(fetchFleetUptime30d)

 const stats = () => [
   { label: "Network Capacity", value: infrastructureData.stats.capacity },
   { label: "RAM (DDR4/DDR5)", value: infrastructureData.stats.ram },
   { label: "vCPU Cores", value: infrastructureData.stats.cores },
   {
     label: "Uptime (30d)",
     value: liveUptime() != null ? `${liveUptime()!.toFixed(2)}%` : infrastructureData.stats.uptime,
     href: 'https://status.rotko.net',
   },
 ]

 return (
   <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
     <For each={stats()}>
       {(stat) => {
         const href = (stat as { href?: string }).href
         return (
           <div class="bg-gray-900/50 border border-gray-700 p-4 text-center">
             <div class="text-3xl font-bold text-cyan-400 font-mono">
               {href ? (
                 <a href={href} target="_blank" rel="noopener noreferrer" class="hover:text-cyan-300 transition-colors" title="Live status — status.rotko.net">
                   {stat.value}
                 </a>
               ) : (
                 stat.value
               )}
             </div>
             <div class="text-sm text-gray-400">{stat.label}</div>
           </div>
         )
       }}
     </For>
   </div>
 )
}

export default InfrastructureStats
