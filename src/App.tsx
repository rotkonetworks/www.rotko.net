import { Component } from 'solid-js'
import { Route } from '@solidjs/router'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import TeamPage from './pages/TeamPage'
import InfrastructurePage from './pages/InfrastructurePage'

const App: Component = () => {
  return (
    <>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/infrastructure" component={InfrastructurePage} />
    </>
  )
}

export default App
