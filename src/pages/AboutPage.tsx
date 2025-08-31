import { Component, createSignal, onMount, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { aboutData } from '../data/about-data'
import WirssiChat from '../components/WirssiChat'

const AboutPage: Component = () => {
 const [visible, setVisible] = createSignal(false)
 const [chatOpen, setChatOpen] = createSignal(false)
 
 onMount(() => {
   setTimeout(() => setVisible(true), 100)
   setTimeout(() => setChatOpen(true), 1000)
 })

 return (
   <MainLayout>
     <section class="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
       <div class={`transition-all duration-700 ${visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
         
         {/* Header */}
         <div class="mb-16">
           <h1 class="text-4xl lg:text-5xl font-bold mb-6 text-gray-100">
             {aboutData.hero.title}
           </h1>
           <p class="text-xl text-gray-400 max-w-3xl">
             {aboutData.hero.subtitle}
           </p>
         </div>

         {/* Services - What We Can Build For You */}
         <div class="mb-20">
           <h2 class="text-3xl font-bold mb-8 text-cyan-400">What We Can Build For You</h2>
           <div class="grid md:grid-cols-2 gap-6">
             <For each={aboutData.services}>
               {(service) => (
                 <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                   <h3 class="text-xl font-bold mb-2 text-cyan-400">{service.name}</h3>
                   <p class="text-gray-300 mb-4">{service.description}</p>
                   <ul class="space-y-1">
                     <For each={service.features}>
                       {(feature) => (
                         <li class="text-gray-400 text-sm flex items-start">
                           <span class="text-cyan-400 mr-2">✓</span>
                           {feature}
                         </li>
                       )}
                     </For>
                   </ul>
                 </div>
               )}
             </For>
           </div>
         </div>

         {/* Mission */}
         <div class="grid lg:grid-cols-2 gap-12 mb-20">
           <div>
             <h2 class="text-2xl font-bold mb-4 text-gray-100">{aboutData.problem.title}</h2>
             <div class="space-y-4 text-gray-300">
               <For each={aboutData.problem.content}>
                 {(paragraph) => <p>{paragraph}</p>}
               </For>
             </div>
           </div>
           
           <div>
             <h2 class="text-2xl font-bold mb-4 text-gray-100">{aboutData.solution.title}</h2>
             <div class="space-y-4 text-gray-300">
               <For each={aboutData.solution.content}>
                 {(paragraph) => <p>{paragraph}</p>}
               </For>
             </div>
           </div>
         </div>

         {/* Core Principles */}
         <div class="mb-20">
           <h2 class="text-2xl font-bold mb-8 text-gray-100">Core Principles</h2>
           <div class="grid md:grid-cols-2 gap-8">
             <For each={aboutData.principles}>
               {(principle) => (
                 <div class="border border-gray-700 p-6 rounded-lg">
                   <h3 class="text-lg font-bold mb-3 text-cyan-400">{principle.title}</h3>
                   <p class="text-gray-400">{principle.description}</p>
                 </div>
               )}
             </For>
           </div>
         </div>

         {/* Technical Excellence */}
         <div class="mb-20">
           <h2 class="text-2xl font-bold mb-8 text-gray-100">Technical Foundation</h2>
           <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-8">
             <div class="grid md:grid-cols-2 gap-8">
               <For each={aboutData.technical}>
                 {(spec) => (
                   <div>
                     <h3 class="text-lg font-bold mb-4 text-cyan-400">{spec.category}</h3>
                     <ul class="space-y-2 text-gray-400">
                       <For each={spec.items}>
                         {(item) => <li>• {item}</li>}
                       </For>
                     </ul>
                   </div>
                 )}
               </For>
             </div>
           </div>
         </div>

         {/* Contact CTA Section */}
         <div class="mb-20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-400/50 rounded-lg p-8">
           <h2 class="text-3xl font-bold mb-4 text-cyan-400">{aboutData.contact.title}</h2>
           <p class="text-xl text-gray-300 mb-2">{aboutData.contact.description}</p>
           <p class="text-lg text-gray-400 mb-6">{aboutData.contact.cta}</p>
           
           <div class="grid md:grid-cols-2 gap-6 font-mono text-sm">
             <div class="space-y-3">
               <div class="flex justify-between">
                 <span class="text-gray-400">Server:</span>
                 <span class="text-cyan-400">{aboutData.contact.irc.server}</span>
               </div>
               <div class="flex justify-between">
                 <span class="text-gray-400">Ports:</span>
                 <span class="text-cyan-400">{aboutData.contact.irc.ports}</span>
               </div>
               <div class="flex justify-between">
                 <span class="text-gray-400">Channel:</span>
                 <span class="text-cyan-400">{aboutData.contact.irc.channel}</span>
               </div>
             </div>
             <div class="space-y-3">
               <div>
                 <span class="text-gray-400 block mb-1">Tor:</span>
                 <span class="text-cyan-400 text-xs break-all">{aboutData.contact.irc.tor}</span>
               </div>
               <button
                 onClick={() => setChatOpen(true)}
                 class="w-full px-6 py-3 bg-cyan-400 text-black font-bold rounded hover:bg-cyan-300 transition-colors text-lg"
               >
                 Start Conversation →
               </button>
             </div>
           </div>
         </div>

         {/* Company Info */}
         <div>
           <h2 class="text-2xl font-bold mb-8 text-gray-100">Company</h2>
           <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
             <For each={aboutData.metrics}>
               {(metric) => (
                 <div class="border border-gray-700 p-4 rounded-lg">
                   <div class="text-gray-500 mb-1">{metric.label}</div>
                   <div class="text-xl font-bold text-cyan-400">{metric.value}</div>
                 </div>
               )}
             </For>
           </div>
         </div>

       </div>
     </section>

     {/* IRC Chat Widget */}
     {chatOpen() && (
       <WirssiChat 
         server="wss://irc.rotko.net/webirc"
         channel="#rotko"
         position="bottom-right"
       />
     )}
   </MainLayout>
 )
}

export default AboutPage
