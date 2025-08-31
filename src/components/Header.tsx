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
           <img 
             src="/images/rotko-icon.svg" 
             alt="Rotko Networks"
             class="w-10 h-10"
           />
           <img 
             src="/images/rotko-logo.svg" 
             alt="Rotko Networks"
             class="h-8 hidden sm:block"
           />
         </A>

         {/* Navigation */}
         <Navigation />
       </div>
     </div>
   </header>
 )
}

export default Header
