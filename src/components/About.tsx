export default function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-5 py-20">
      <SectionLabel index="01" title="about" />
      <div className="mt-6 grid gap-10 sm:grid-cols-5">
        <div className="sm:col-span-3">
          <p className="text-base leading-relaxed text-mute sm:text-lg">
            I'm a final-year student splitting my time between offensive security and
            frontend development. On the security side I work through Active Directory
            and web application attack paths on HackTheBox and TryHackMe, and I'm
            training toward SOC analyst work. On the development side I build with
            React, TypeScript and Tailwind CSS, freelancing and working through
            DIJICOM, a product engineering studio in Nairobi.
          </p>
          <p className="mt-4 text-base leading-relaxed text-mute sm:text-lg">
            The two sides feed each other: understanding how applications get attacked
            makes me build them more carefully, and building real interfaces keeps my
            security work grounded in how systems are actually used.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 self-start font-mono text-sm sm:col-span-2">
          <Fact term="focus" value="AD & web pentesting, SOC training" />
          <Fact term="stack" value="React, TypeScript, Tailwind" />
          <Fact term="based in" value="Kenya" />
          <Fact term="status" value="final-year student" />
        </dl>
      </div>
    </section>
  )
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-mute">{term}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  )
}

export function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs text-mute">
      <span className="text-phos-dim">{index}</span>
      <span className="h-px flex-1 bg-line" />
      <span className="uppercase tracking-widest">{title}</span>
    </div>
  )
}
