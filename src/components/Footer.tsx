import { Component } from 'solid-js'
import { siteData } from '../data/site-data'

const Footer: Component = () => {
  return (
    <footer class="border-t border-gray-8 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-3 gap-8">
          <div>
            <h3 class="text-cyan-3 font-bold mb-4">Infrastructure</h3>
            <ul class="space-y-2 text-sm text-gray-4">
              <li>BGP: AS142108</li>
              <li>Location: {siteData.company.location}</li>
              <li>Network: 12Gbps</li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-cyan-3 font-bold mb-4">Services</h3>
            <ul class="space-y-2 text-sm text-gray-4">
              <li><a href="/endpoints" class="hover:text-cyan-3">RPC Endpoints</a></li>
              <li><a href="/networks" class="hover:text-cyan-3">Validator Services</a></li>
              <li><a href="/resources" class="hover:text-cyan-3">Network Tools</a></li>
            </ul>
          </div>

          <div>
            <h3 class="text-cyan-3 font-bold mb-4">Contact</h3>
            <ul class="space-y-2 text-sm text-gray-4">
              <li>{siteData.contact.email}</li>
              <li>IRC: {siteData.contact.irc.channel}</li>
              <li><a href="https://github.com/rotkonetworks" class="hover:text-cyan-3">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div class="mt-12 pt-8 border-t border-gray-9 text-center text-sm text-gray-5">
          © 2025 Rotko Networks. Infrastructure that doesn't suck.
        </div>
      </div>
    </footer>
  )
}

export default Footer
