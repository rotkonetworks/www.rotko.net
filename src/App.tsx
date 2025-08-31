// src/App.tsx
import { Router, Route } from '@solidjs/router'
import HomePage from './pages/HomePage'
import TeamPage from './pages/TeamPage'
import './index.css'

function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} />
      <Route path="/team" component={TeamPage} />
      {/* Add other routes as needed */}
    </Router>
  )
}

export default App
