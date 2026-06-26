import { Component } from 'solid-js'
import { Route } from '@solidjs/router'
import HomePage from './pages/HomePage'
import TeamPage from './pages/TeamPage'
import InfrastructurePage from './pages/InfrastructurePage'
import ServicesPage from './pages/ServicesPage'
import StakingPage from './pages/services/StakingPage'
import PenumbraStakingPage from './pages/services/PenumbraStakingPage'
import EndpointsPage from './pages/services/EndpointsPage'
import ColocationPage from './pages/ColocationPage'
import HostingPage from './pages/HostingPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import NewsPage from './pages/NewsPage'
import NewsPostPage from './pages/NewsPostPage'
import SoftwarePage from './pages/SoftwarePage'
import SoftwarePostPage from './pages/SoftwarePostPage'
import ContactPage from './pages/ContactPage'
import ValidatorPage from './pages/ValidatorPage'
import DashboardPage from './pages/DashboardPage'
import AuthVerifyPage from './pages/AuthVerifyPage'
import ConsolePage from './pages/ConsolePage'

const App: Component = () => {
  return (
    <>
      <Route path="/" component={HomePage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/services/staking" component={StakingPage} />
      <Route path="/services/staking/penumbra" component={PenumbraStakingPage} />
      <Route path="/services/staking/:network" component={StakingPage} />
      <Route path="/services/endpoints" component={EndpointsPage} />
      <Route path="/services/endpoints/:network" component={EndpointsPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:slug" component={NewsPostPage} />
      <Route path="/software" component={SoftwarePage} />
      <Route path="/software/vctl" component={ValidatorPage} />
      <Route path="/software/:slug" component={SoftwarePostPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/infrastructure" component={InfrastructurePage} />
      <Route path="/colocation" component={ColocationPage} />
      <Route path="/hosting" component={HostingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/console/:vmid" component={ConsolePage} />
      <Route path="/auth/verify" component={AuthVerifyPage} />
    </>
  )
}

export default App
