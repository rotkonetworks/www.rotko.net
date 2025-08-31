import { Component, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { footerData } from '../data/navigation-data'

const Footer: Component = () => {
 return (
   <footer class="bg-gray-900/50 border-t border-gray-800 mt-20">
     <div class="max-w-7xl mx-auto px-6 lg:px-12 py-12">
       <div class="grid md:grid-cols-4 gap-8">
         <For each={footerData.sections}>
           {(section) => (
             <div>
               <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                 {section.title}
               </h3>
               <ul class="space-y-2">
                 <For each={section.links}>
                   {(link) => (
                     <li>
                       <Show
                         when={link.external}
                         fallback={
                           <A href={link.href} class="text-gray-500 hover:text-cyan-400 transition-colors">
                             {link.label}
                           </A>
                         }
                       >
                         <a href={link.href} target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-cyan-400 transition-colors">
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
       
       <div class="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
         <div class="text-gray-500 text-sm">
           {footerData.copyright}
         </div>
         <div class="text-gray-500 text-sm mt-4 md:mt-0">
           {footerData.tagline}
         </div>
       </div>
     </div>
   </footer>
 )
}

export default Footer
