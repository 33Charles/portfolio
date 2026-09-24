import { SectionLabel } from './About'
import { site } from '../site'

const LINKS = [
  { label: 'email', value: site.email, href: `mailto:${site.email}` },
  { label: 'phone', value: site.phoneDisplay, href: `tel:${site.phone}` },
  { label: 'github', value: site.github.label, href: site.github.url },
  { label: 'tryhackme', value: 'tryhackme.com/p/D4SEIN', href: site.tryhackme },
  { label: 'hackthebox', value: 'app.hackthebox.com/…/1691258', href: site.hackthebox },
]

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-5xl px-5 py-20">
      <SectionLabel index="04" title="contact" />
      <h2 className="mt-6 max-w-xl text-2xl font-semibold text-ink sm:text-3xl">
        Open to freelance frontend work and security opportunities.
      </h2>
      <dl className="mt-8 grid gap-4 font-mono text-sm sm:grid-cols-2">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            className="flex items-center justify-between rounded border border-line px-4 py-3 transition-colors hover:border-phos-dim"
          >
            <span className="text-mute">{link.label}</span>
            <span className="text-ink group-hover:text-phos">{link.value}</span>
          </a>
        ))}
      </dl>
    </section>
  )
}
