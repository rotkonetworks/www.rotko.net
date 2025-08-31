import { Component } from 'solid-js'
import { A } from '@solidjs/router'
import Navigation from './Navigation'
import { headerData } from '../data/navigation-data'

const Header: Component = () => {
 return (
   <header class="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
     <div class="max-w-7xl mx-auto px-6 lg:px-12">
       <div class="flex items-center justify-between h-16">
         {/* Logo */}
         <A href="/" class="flex items-center space-x-3">
           <div class="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
             <span class="text-white font-bold text-xl">{headerData.logo.initial}</span>
           </div>
           <span class="text-xl font-bold text-gray-100">
             {headerData.logo.text}<span class="text-cyan-400">.</span>{headerData.logo.suffix}
           </span>
         </A>

         {/* Navigation */}
         <Navigation />
       </div>
     </div>
   </header>
 )
}

export default Header
