import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import TeamCard from '../components/TeamCard'
import { teamData, teamPageData } from '../data/team-data'

const TeamPage: Component = () => {
  return (
    <MainLayout>
      <section class="pt-12 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div class="mb-8 border-b border-gray-700 pb-4">
          <h1 class="text-3xl font-bold text-cyan-400 mb-2">
            {teamPageData.hero.title}
          </h1>
          <p class="text-gray-300">
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
        <div class="mb-8 border border-gray-700 bg-gray-900 p-6">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Team Principles</h2>
          <div class="space-y-2 text-sm">
            <For each={teamPageData.principles}>
              {(principle, index) => (
                <div class="text-gray-300 flex items-start">
                  <span class="text-cyan-500 mr-2">{index() + 1}.</span>
                  <span>{principle}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Careers */}
        <div class="border border-gray-700 bg-gray-900 p-6">
          <h2 class="text-xl font-bold text-cyan-400 mb-4">Careers at Rotko</h2>
          <div class="text-gray-300 text-sm mb-4">
            <p class="mb-3">
              Interested in joining our team? We're always looking for talented individuals who share our passion for innovation and quality.
            </p>
            <p>
              Connect with us on IRC to discuss opportunities, ask questions, or just chat about technology.
            </p>
          </div>
          <div class="text-sm">
            <a
              href="/contact"
              class="text-cyan-400 hover:text-cyan-300 underline"
            >
              [Contact Us]
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default TeamPage