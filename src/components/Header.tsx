import { useEffect, useState } from 'react'
import { site } from '../site'
import GlitchText from './GlitchText'

const NAV = [
  { href: '#about', label: 'about' },
  { href: '#skills', label: 'skills' },
  { href: '#projects', label: 'projects' },
  { href: site.notesPath, label: 'labs & notes', external: true },
  { href: '#contact', label: 'contact' },
]

const ROLES = [
  site.handle,
  'Penetration Tester... ',
  'SOC Analyst... ',
  'Security Researcher... ',
  'Fullstack Developer... ',
  'CTF Player... ',
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const currentRole = ROLES[roleIndex]

    const typingSpeed = isDeleting ? 45 : 90
    const pauseAfterTyping = 1800
    const pauseAfterDeleting = 400

    let timeout

    if (!isDeleting && displayText === currentRole) {
      timeout = setTimeout(() => {
        setIsDeleting(true)
      }, pauseAfterTyping)
    } else if (isDeleting && displayText === '') {
      timeout = setTimeout(() => {
        setIsDeleting(false)
        setRoleIndex((prev) => (prev + 1) % ROLES.length)
      }, pauseAfterDeleting)
    } else {
      timeout = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? currentRole.substring(0, displayText.length - 1)
            : currentRole.substring(0, displayText.length + 1)
        )
      }, typingSpeed)
    }

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, roleIndex])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors ${
        scrolled
          ? 'bg-bg/90 backdrop-blur-sm border-b border-line'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">

        <a
          href="#top"
          className="font-mono text-sm font-extrabold text-phos whitespace-nowrap"
        >
          <span className='text-base'>&gt;_ </span>
          <GlitchText text={displayText} />
          <span className="ml-0.5 animate-pulse">|</span>
        </a>

        {/* Navigation */}
        <nav className="flex items-center gap-4 font-mono text-xs sm:gap-6 sm:text-sm">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer' : undefined}
              className="text-mute transition-colors hover:text-phos"
            >
              {item.label}
            </a>
          ))}
        </nav>

      </div>
    </header>
  )
}