import { useEffect, useState } from 'react'
import Background from './components/Background'
import BootSequence from './components/BootSequence'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'

const SKIP_KEY = 'boot-seen'

export default function App() {
  // Show the boot sequence once per browser session, not on every navigation back to the page.
  const [booted, setBooted] = useState(() => sessionStorage.getItem(SKIP_KEY) === '1')

  useEffect(() => {
    if (booted) sessionStorage.setItem(SKIP_KEY, '1')
  }, [booted])

  return (
    <>
      <Background />
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <div className={booted ? 'opacity-100' : 'opacity-0'}>
        <Header />
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  )
}
