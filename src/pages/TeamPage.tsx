import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import TeamCard from '../components/TeamCard'
import { teamData, teamPageData } from '../data/team-data'

const TeamPage: Component = () => {
  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="mb-10">
          <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">Team</div>
          <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {teamPageData.hero.title}
          </h1>
          <p class="text-lg text-gray-300 mt-5 max-w-2xl leading-relaxed">
            {teamPageData.hero.subtitle}
          </p>
        </div>

        {/* Team Grid */}
        <div class="mb-8">
          <div class="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            <For each={teamData}>
              {(member, index) => (
                <TeamCard member={member} index={index()} />
              )}
            </For>
          </div>
        </div>

        {/* Principles */}
        <div class="mb-16">
          <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">How we operate</div>
          <h2 class="text-2xl font-bold text-white tracking-tight mb-6">Principles</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <For each={teamPageData.principles}>
              {(principle, index) => (
                <div class="rounded-xl border border-gray-800 bg-gray-900/40 p-5 flex items-start gap-4">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full border border-cyan-700/60 text-cyan-400 font-mono text-sm flex items-center justify-center">
                    {index() + 1}
                  </span>
                  <span class="text-gray-300 leading-relaxed pt-0.5">{principle}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default TeamPage