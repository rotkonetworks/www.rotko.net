import { Component, For } from 'solid-js'
import { infrastructureData } from '../data/infrastructure-data'

const InfrastructureStats: Component = () => {
 const stats = [
   { label: "Network Capacity", value: infrastructureData.stats.capacity },
   { label: "RAM (DDR4/DDR5)", value: infrastructureData.stats.ram },
   { label: "vCPU Cores", value: infrastructureData.stats.cores },
   { label: "Uptime", value: infrastructureData.stats.uptime }
 ]

 return (
   <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
     <For each={stats}>
       {(stat) => (
         <div class="bg-gray-900/50 border border-gray-700 p-4 text-center">
           <div class="text-3xl font-bold text-cyan-400 font-mono">{stat.value}</div>
           <div class="text-sm text-gray-400">{stat.label}</div>
         </div>
       )}
     </For>
   </div>
 )
}

export default InfrastructureStats
