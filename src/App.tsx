import { Component } from 'solid-js'
import { Route } from '@solidjs/router'
import HomePage from './pages/HomePage'
import TeamPage from './pages/TeamPage'
import InfrastructurePage from './pages/InfrastructurePage'
import ServicesPage from './pages/ServicesPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import SoftwarePage from './pages/SoftwarePage'
import ContactPage from './pages/ContactPage'

const App: Component = () => {
 return (
   <>
     <Route path="/services" component={ServicesPage} />
     <Route path="/blog" component={BlogPage} />
     <Route path="/blog/:slug" component={BlogPostPage} />
     <Route path="/software" component={SoftwarePage} />
     <Route path="/" component={HomePage} />
     <Route path="/team" component={TeamPage} />
     <Route path="/infrastructure" component={InfrastructurePage} />
     <Route path="/contact" component={ContactPage} />
   </>
 )
}

export default App
