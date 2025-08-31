import { Component, For, createSignal, onMount } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { infrastructureData } from '../data/infrastructure-data'
import InfrastructureStats from '../components/InfrastructureStats'
import RackDiagram from '../components/RackDiagram'

const InfrastructurePage: Component = () => {
 const [visible, setVisible] = createSignal(false)
 
 onMount(() => {
   setTimeout(() => setVisible(true), 100)
 })

 return (
   <MainLayout>
     <section class="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
       <div class={`transition-all duration-700 ${visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
         
         {/* Header */}
         <div class="mb-16">
           <h1 class="text-4xl lg:text-5xl font-bold mb-6 text-gray-100 font-mono">
             {infrastructureData.hero.title}
           </h1>
           <p class="text-xl text-gray-400">
             {infrastructureData.hero.subtitle}
           </p>
         </div>

         {/* Stats */}
         <InfrastructureStats />

         {/* IBP Section */}
         <div class="mb-16 bg-gray-900/50 border border-gray-700 rounded-lg p-8">
           <h2 class="text-2xl font-bold mb-4 text-cyan-400">{infrastructureData.ibpStats.title}</h2>
           <p class="text-gray-300 mb-6">{infrastructureData.ibpStats.description}</p>
           <div class="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
             <For each={infrastructureData.ibpStats.metrics}>
               {(metric) => (
                 <div class="text-center">
                   <div class="text-2xl font-bold text-cyan-400">{metric.value}</div>
                   <div class="text-xs text-gray-400">{metric.label}</div>
                 </div>
               )}
             </For>
           </div>
           <a href={infrastructureData.ibpStats.dashboard} target="_blank" class="text-cyan-400 hover:text-cyan-300 text-sm">
             View Live Dashboard →
           </a>
         </div>

         {/* Rack & Hardware */}
         <div class="grid lg:grid-cols-2 gap-12 mb-16">
           <div>
             <RackDiagram />
           </div>
           <div>
             <h2 class="text-2xl font-bold mb-6 text-cyan-400">Hardware Specifications</h2>
             
             {/* Routers */}
             <div class="mb-6">
               <h3 class="text-lg font-bold mb-3 text-gray-200">Routing Equipment</h3>
               <div class="space-y-2">
                 <For each={infrastructureData.hardware.routers}>
                   {(router) => (
                     <div class="text-sm text-gray-400">
                       <span class="text-gray-300">{router.count}x {router.model}</span> - {router.role}
                     </div>
                   )}
                 </For>
               </div>
             </div>

             {/* Compute */}
             <div class="mb-6">
               <h3 class="text-lg font-bold mb-3 text-gray-200">Compute Nodes</h3>
               <div class="space-y-2">
                 <For each={infrastructureData.hardware.compute}>
                   {(server) => (
                     <div class="text-sm text-gray-400">
                       <span class="text-gray-300">{server.count}x {server.model}</span> - {server.role}
                     </div>
                   )}
                 </For>
               </div>
             </div>

             {/* Datacenter */}
             <div>
               <h3 class="text-lg font-bold mb-3 text-gray-200">Datacenter</h3>
               <dl class="space-y-1 text-sm">
                 <For each={Object.entries(infrastructureData.datacenter)}>
                   {([key, value]) => (
                     <div class="flex justify-between">
                       <dt class="text-gray-400 capitalize">{key}:</dt>
                       <dd class="text-gray-300">{value}</dd>
                     </div>
                   )}
                 </For>
               </dl>
             </div>
           </div>
         </div>

         {/* Connectivity */}
         <div class="mb-16">
           <h2 class="text-2xl font-bold mb-6 text-gray-100">Network Connectivity</h2>
           <div class="grid lg:grid-cols-2 gap-8">
             <div>
               <h3 class="text-lg font-bold mb-4 text-cyan-400">Transit Providers</h3>
               <div class="space-y-2">
                 <For each={infrastructureData.connectivity.transit}>
                   {(transit) => (
                     <div class="flex justify-between text-sm">
                       <span class="text-gray-300">{transit.provider}</span>
                       <span class="text-gray-400">{transit.speed}</span>
                     </div>
                   )}
                 </For>
               </div>
             </div>
             <div>
               <h3 class="text-lg font-bold mb-4 text-cyan-400">Exchange Points</h3>
               <div class="space-y-2">
                 <For each={infrastructureData.connectivity.exchanges}>
                   {(ix) => (
                     <div class="flex justify-between text-sm">
                       <span class="text-gray-300">{ix.name}</span>
                       <span class="text-gray-400">{ix.speed} • {ix.type}</span>
                     </div>
                   )}
                 </For>
               </div>
             </div>
           </div>
         </div>

         {/* Services */}
         <div class="mb-16">
           <h2 class="text-2xl font-bold mb-6 text-gray-100">Services</h2>
           <div class="grid md:grid-cols-3 gap-6">
             <For each={infrastructureData.services}>
               {(service) => (
                 <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                   <h3 class="text-lg font-bold mb-2 text-cyan-400">{service.name}</h3>
                   <p class="text-gray-400 text-sm mb-4">{service.description}</p>
                   <ul class="space-y-1">
                     <For each={service.features}>
                       {(feature) => (
                         <li class="text-gray-500 text-sm">• {feature}</li>
                       )}
                     </For>
                   </ul>
                 </div>
               )}
             </For>
           </div>
         </div>

         {/* Routing Philosophy */}
         <div class="mb-16 bg-gray-900/50 border border-gray-700 rounded-lg p-8">
           <h2 class="text-2xl font-bold mb-4 text-cyan-400">{infrastructureData.routing.title}</h2>
           <p class="text-gray-300 mb-6">{infrastructureData.routing.description}</p>
           <div class="grid md:grid-cols-2 gap-4">
             <For each={infrastructureData.routing.features}>
               {(feature) => (
                 <div class="flex items-start gap-2">
                   <span class="text-cyan-400 mt-1">•</span>
                   <span class="text-gray-400 text-sm">{feature}</span>
                 </div>
               )}
             </For>
           </div>
         </div>

         {/* Resilience */}
         <div>
           <h2 class="text-2xl font-bold mb-6 text-gray-100">Resilience & Redundancy</h2>
           <div class="grid md:grid-cols-2 gap-4">
             <For each={infrastructureData.resilience}>
               {(item) => (
                 <div class="flex items-start gap-2">
                   <span class="text-cyan-400 mt-1">✓</span>
                   <span class="text-gray-300">{item}</span>
                 </div>
               )}
             </For>
           </div>
         </div>

       </div>
     </section>
   </MainLayout>
 )
}

export default InfrastructurePage
