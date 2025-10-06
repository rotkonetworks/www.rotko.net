import { Component } from 'solid-js'
import { A } from '@solidjs/router'

interface Props {
  slug: string
  title: string
  repo: string
  website?: string
  description?: string
}

const SoftwareCard: Component<Props> = (props) => (
  <A
    href={`/software/${props.slug}`}
    class="group block border border-gray-700 p-6 rounded-xl bg-gray-900 hover:bg-gray-800 transition h-full"
  >
    <h2 class="text-2xl font-bold text-cyan-400 mb-3 group-hover:text-cyan-300 transition-colors">
      {props.title}
    </h2>
    {props.description && (
      <p class="text-gray-400 mb-4 line-clamp-3">
        {props.description}
      </p>
    )}
    <div class="flex gap-4 text-sm">
      <span class="text-blue-400">Repository</span>
      {props.website && (
        <span class="text-green-400">Website</span>
      )}
    </div>
  </A>
)

export default SoftwareCard
