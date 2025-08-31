import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import App from './App'
import 'uno.css'
import './index.css'

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById('root')!
)
