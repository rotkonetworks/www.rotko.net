import { Component } from 'solid-js'

interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

const PageHeader: Component<PageHeaderProps> = (props) => {
  return (
    <div class={`mb-8 border-b border-gray-700 pb-4 ${props.className || ''}`}>
      <h1 class="text-3xl font-bold text-cyan-400 mb-2">{props.title}</h1>
      {props.subtitle && (
        <p class="text-gray-300">{props.subtitle}</p>
      )}
    </div>
  )
}

export default PageHeader