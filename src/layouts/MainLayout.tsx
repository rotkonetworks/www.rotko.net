import { Component, JSX } from 'solid-js'
import Header from '../components/Header'
import Footer from '../components/Footer'

interface MainLayoutProps {
 children: JSX.Element
}

const MainLayout: Component<MainLayoutProps> = (props) => {
 return (
   <div class="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
     <Header />
     <main class="pt-16 flex-1">
       {props.children}
     </main>
     <Footer />
   </div>
 )
}

export default MainLayout
