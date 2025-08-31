import { Component, createSignal, onMount, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { aboutData } from '../data/about-data'

const AboutPage: Component = () => {
 const [visible, setVisible] = createSignal(false)
 
 onMount(() => {
   setTimeout(() => setVisible(true), 100)
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
           <div class="grid md:grid-cols-3 gap-8">
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

         {/* Company Info */}
         <div class="mb-20">
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
   </MainLayout>
 )
}

export default AboutPage
