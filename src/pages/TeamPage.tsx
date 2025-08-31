import { Component, createSignal, createEffect, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import TeamCard from '../components/TeamCard'
import { teamData } from '../data/team-data'

const TeamPage: Component = () => {
 const [displayText, setDisplayText] = createSignal("")
 const fullText = "TEAM.EXE"

 createEffect(() => {
   let currentIndex = 0
   const typingInterval = setInterval(() => {
     if (currentIndex <= fullText.length) {
       setDisplayText(fullText.slice(0, currentIndex))
       currentIndex++
     } else {
       clearInterval(typingInterval)
     }
   }, 150)

   return () => clearInterval(typingInterval)
 })

 return (
   <MainLayout>
     {/* Team content */}
     <section class="py-24 px-6 lg:px-12">
       <div class="max-w-7xl mx-auto">
         {/* Header */}
         <div class="text-center mb-20">
           <div class="relative inline-block">
             <h2 
               class="text-5xl lg:text-6xl font-bold font-mono tracking-wider mb-6"
               style={{ color: "#09fcf5" }}
             >
               {displayText()}
               <span class="animate-pulse">|</span>
             </h2>
           </div>
           <p class="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-mono">
             {">"} No consultants. No outsourcing. Engineers who ship.
           </p>
           <p class="text-lg text-gray-400 max-w-2xl mx-auto mt-4 font-mono">
             Combined: 80+ years building systems. 0 tolerance for downtime.
           </p>
           
           {/* Key metrics */}
           <div class="flex justify-center gap-8 mt-8 text-sm font-mono">
             <div><span style={{ color: "#09fcf5" }}>24/7</span> uptime</div>
             <div><span style={{ color: "#09fcf5" }}>6</span> continents served</div>
             <div><span style={{ color: "#09fcf5" }}>0</span> vendor lock-in</div>
           </div>
           
           <div class="mt-6 text-sm font-mono" style={{ color: "#09fcf5" }}>
             [CLICK CARDS TO VIEW SYSTEM.CONFIG]
           </div>
         </div>

         {/* Team Grid */}
         <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           <For each={teamData}>
             {(member, index) => (
               <div
                 class="transform transition-all duration-300 hover:scale-105"
                 style={{
                   animation: `float 3s ease-in-out infinite ${index() * 0.5}s`
                 }}
               >
                 <TeamCard member={member} index={index()} />
               </div>
             )}
           </For>
         </div>

         {/* Footer */}
         <div class="mt-20 text-center">
           <div
             class="inline-block p-6 rounded border font-mono text-sm mb-8"
             style={{
               "background-color": "rgba(9, 252, 245, 0.1)",
               "border-color": "#09fcf5",
               color: "#09fcf5"
             }}
           >
             <div class="text-lg mb-2">Why this matters:</div>
             <div class="text-gray-300 space-y-1 text-left">
               <div>• Nokia veterans + young blood = institutional knowledge with modern execution</div>
               <div>• Built infra before cloud existed. Know what actually matters.</div>
               <div>• Use our own products daily. Dogfooding isn't optional.</div>
               <div>• Remote-first since before COVID. Async by default.</div>
             </div>
           </div>
           
           <div
             class="inline-block p-4 rounded border font-mono text-xs"
             style={{
               "background-color": "rgba(255, 128, 0, 0.1)",
               "border-color": "#ff8000",
               color: "#ff8000"
             }}
           >
             {">"} EOF: All systems operational. Ready for next challenge.
           </div>
         </div>
       </div>
     </section>
   </MainLayout>
 )
}

export default TeamPage
