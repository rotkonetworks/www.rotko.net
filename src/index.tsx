import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import App from './App'
import { ChatProvider } from './contexts/ChatProvider'
import 'uno.css'
import './index.css'

render(
  () => (
    <ChatProvider>
      <Router>
        <App />
      </Router>
    </ChatProvider>
  ),
  document.getElementById('root')!
)
