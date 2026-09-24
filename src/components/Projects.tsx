import { SectionLabel } from './About'

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-5xl px-5 py-20">
      <SectionLabel index="03" title="projects" />
      <div className="mt-6 rounded-lg border border-dashed border-line p-8 text-center sm:p-12">
        <p className="font-mono text-sm text-phos-dim">// TODO</p>
        <p className="mt-2 text-mute">
          Case studies are being written up. In the meantime, my HTB write-ups and
          TryHackMe profile show recent, hands-on work.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 font-mono text-xs">
          <a
            href="/labs-and-notes/"
            target="_blank"
            rel="noreferrer"
            className="rounded border border-line px-3 py-1.5 text-ink transition-colors hover:border-phos-dim hover:text-phos"
          >
            labs & notes
          </a>
        </div>
      </div>
    </section>
  )
}
