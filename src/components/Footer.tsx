import { site } from '../site'

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 font-mono text-xs text-mute sm:flex-row">
        <span>
          {site.name} <span className="text-phos-dim">·</span> {site.handle}
        </span>
        <span>&copy; {new Date().getFullYear()}. Built with React, TypeScript &amp; Tailwind.</span>
      </div>
    </footer>
  )
}
