import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import TeamCard from '../components/TeamCard'
import { teamData, teamPageData } from '../data/team-data'

const TeamPage: Component = () => {
  return (
    <MainLayout>
      <section class="py-16 px-6 lg:px-12 font-mono">
        <div class="max-w-7xl mx-auto">
          {/* header */}
          <div class="mb-8 text-left">
            <div class="border-l-4 border-green-400 pl-6 bg-gradient-to-r from-green-400/5 to-transparent py-6">
              <h1 class="text-4xl lg:text-5xl font-bold mb-4 text-white">
                {teamPageData.hero.title}
              </h1>
              <p class="text-lg text-gray-300 leading-relaxed font-light">
                {teamPageData.hero.subtitle}
              </p>
            </div>
          </div>

          {/* team grid */}
          <div class="mb-6">
            {/* mobile: single column */}
            <div class="md:hidden space-y-3">
              <For each={teamData}>
                {(member, index) => (
                  <TeamCard member={member} index={index()} />
                )}
              </For>
            </div>

            {/* desktop: grid layout */}
            <div class="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              <For each={teamData}>
                {(member, index) => (
                  <TeamCard member={member} index={index()} />
                )}
              </For>
            </div>
          </div>

          {/* principles */}
          <div class="border-t border-gray-800 pt-6">
            <div class="bg-black/70 border border-gray-700 rounded-xl p-6 font-mono text-sm">
              <div class="text-gray-500 mb-6 flex items-center gap-2">
                <span>#</span>
                <span class="text-cyan-400">team principles</span>
                <span class="text-gray-700 ml-auto">v1.0.0</span>
              </div>
              <div class="space-y-4">
                <For each={teamPageData.principles}>
                  {(principle, index) => (
                    <div class="text-gray-300 leading-relaxed flex items-start gap-3 hover:text-gray-200 transition-colors">
                      <span class="text-green-400 font-bold text-xs mt-1">{index() + 1}.</span>
                      <span>{principle}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* careers */}
          <div class="pt-6">
            <div class="bg-black/70 border border-gray-700 rounded-xl p-6 font-mono text-sm">
              <div class="text-gray-500 mb-6 flex items-center gap-2">
                <span>#</span>
                <span class="text-cyan-400">careers at rotko</span>
              </div>
              <div class="text-gray-300 leading-relaxed mb-6">
                <p class="mb-4">
                  Interested in joining our team? We're always looking for talented individuals who share our passion for innovation and quality.
                </p>
                <p class="mb-4">
                  Connect with us on IRC to discuss opportunities, ask questions, or just chat about technology.
                </p>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-gray-500">connect:</span>
                <a
                  href="/contact"
                  class="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <span>visit our contact page</span>
                  <span class="text-xs">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default TeamPage
