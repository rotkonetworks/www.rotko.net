import { Component, For } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import TeamCard from '../components/TeamCard'
import { teamData, teamPageData } from '../data/team-data'

const TeamPage: Component = () => {
  return (
    <MainLayout>
      <section class="py-24 px-6 lg:px-12">
        <div class="max-w-7xl mx-auto">
          <div class="mb-16 text-center">
            <h1 class="text-5xl lg:text-6xl font-bold mb-6 text-white">
              {teamPageData.hero.title}
            </h1>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              {teamPageData.hero.subtitle}
            </p>
            <div class="flex justify-center gap-12 mt-8">
              <For each={teamPageData.stats}>
                {(stat) => (
                  <div class="text-gray-400">
                    <span class="text-cyan-400 font-bold">{stat.value}</span> {stat.label}
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <For each={teamData}>
              {(member, index) => (
                <TeamCard member={member} index={index()} />
              )}
            </For>
          </div>

          <div class="border-t border-gray-800 pt-12 max-w-4xl mx-auto">
            <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <ul class="space-y-2 text-gray-300">
              <For each={teamPageData.principles}>
                {(principle) => (
                  <li class="flex items-start gap-2">
                    <span class="text-cyan-400 mt-1">•</span>
                    <span>{principle}</span>
                  </li>
                )}
              </For>
            </ul>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default TeamPage
