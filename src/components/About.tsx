export default function About() {
  const expertise = [
    {
      title: "Offensive Security",
      description:
        "Understanding how systems and applications can be assessed, attacked, and hardened through practical security testing.",
      color: "#5bd68a",
    },
    {
      title: "Security Operations",
      description:
        "Analyzing security events and system activity to detect, investigate, and understand potential threats.",
      color: "#e05cff",
    },
    {
      title: "Digital Forensics",
      description:
        "Examining system artifacts and evidence to reconstruct activity and understand what happened during an incident.",
      color: "#ff6b78",
    },
    {
      title: "Full-Stack Development",
      description:
        "Building full-stack applications and APIs while combining software development with practical security considerations.",
      color: "#e6b450",
    },
  ]

  return (
    <section id="about" className="mx-auto max-w-7xl px-2 py-24">
      {/* Section label */}
      <SectionLabel index="02" title="about" />

      {/* Heading */}
      <h2 className="mt-10 text-2xl font-semibold tracking-tight text-phos/70 sm:text-3xl">
        Background & Expertise
      </h2>

      {/* Main content */}
      <div className="mt-8 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        {/* Background */}
        <div className="lg:w-[60%]">
          <div className="space-y-6 text-sm leading-[1.9] text-slate-300/80 sm:text-base">
            <p>
              I'm a cybersecurity practitioner and full-stack developer based
              in Kenya. I hold a BSc in Software Engineering from Murang’a
              University of Technology, with a strong focus on cybersecurity,
              systems, and software development.
            </p>

            <p>
              My current focus is offensive security and security operations,
              with hands-on experience across Active Directory, web
              applications, networks, and Windows and Linux environments. I
              work extensively through practical labs, CTFs, security research,
              and personal projects, while building experience in threat
              detection, log analysis, endpoint monitoring, and digital
              forensics.
            </p>

            <p>
              Alongside cybersecurity, I build full-stack applications and
              security tooling using Python, Flask, React, TypeScript, and
              modern web technologies. Working across both disciplines gives
              me an understanding of systems from both sides, from how an
              application or environment is designed to how it can be abused,
              monitored, and investigated.
            </p>
          </div>
        </div>

        {/* Supporting expertise */}
        <div className="lg:w-[40%] lg:shrink-0">
          <div className="space-y-3">
            {expertise.map((item, index) => (
              <article
                key={item.title}
                className="group relative isolate overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.035] via-black/25 to-black/15 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.025]"
                style={{
                  borderColor: `${item.color}28`,
                }}
              >
                {/* Subtle category tint */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 opacity-70"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${item.color}0b, transparent 65%)`,
                  }}
                />

                {/* Expertise content */}
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      color: item.color,
                      backgroundColor: `${item.color}12`,
                      borderColor: `${item.color}35`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 0 7px ${item.color}65`,
                      }}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-mono text-xs font-semibold text-ink transition-colors duration-300 sm:text-sm">
                        {item.title}
                      </h3>

                      <span className="font-mono text-[9px] text-mute/40">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] leading-[1.8] text-mute sm:text-xs">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom accent */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-4 h-px w-0 transition-all duration-300 group-hover:w-10"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function SectionLabel({
  index,
  title,
}: {
  index: string
  title: string
}) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs text-mute">
      <span className="text-phos-dim">{index}</span>
      <span className="h-px flex-1 bg-line" />
      <span className="uppercase tracking-widest">{title}</span>
    </div>
  )
}