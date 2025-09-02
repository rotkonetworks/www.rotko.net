import { Component, JSX } from 'solid-js'

// Custom components you can inject into blog posts
export const PriceWidget: Component<{symbol: string}> = (props) => {
  return <div class="bg-gray-800 p-4 rounded">Price widget for {props.symbol}</div>
}

export const CodeBlock: Component<{children: JSX.Element}> = (props) => {
  return <pre class="bg-gray-900 p-4 rounded overflow-x-auto"><code>{props.children}</code></pre>
}

// Component registry for dynamic rendering
export const components = {
  PriceWidget,
  CodeBlock
}
