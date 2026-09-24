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
    title: "Security Tooling",
    description:
      "Building practical tools and applications that support security testing, monitoring, analysis, and investigation.",
    color: "#5ec8e6",
  },
  {
    title: "Full-Stack Development",
    description:
      "Building full-stack applications and APIs while combining software development with practical security considerations.",
    color: "#e6b450",
  },
];

  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-24">
      {/* Section label */}
      <div className="flex items-center gap-3 font-mono text-xs text-mute">
        <span className="text-phos-dim">02</span>
        <span className="h-px flex-1 bg-line" />
        <span className="uppercase tracking-widest">about</span>
      </div>

      <h2 className="mt-10 text-2xl font-semibold tracking-tight text-phos/70 sm:text-3xl">
        Background & Expertise
      </h2>

      <div className="mt-8 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        {/* Main content — ~70% */}
        <div className="lg:w-[50%]">
          <div className="space-y-6 text-sm leading-[1.9] text-slate-300/80 sm:text-base">
            <p>
              I'm a cybersecurity practitioner and full-stack developer based in
              Kenya. I hold a BSc in Software Engineering from Murang’a
              University of Technology, with a strong focus on cybersecurity,
              systems, and software development.
            </p>

            <p>
              My current focus is offensive security and security operations,
              with hands-on experience across Active Directory, web
              applications, networks, and Windows and Linux environments. I work
              extensively through practical labs, CTFs, security research, and
              personal projects, while building experience in threat detection,
              log analysis, endpoint monitoring, and digital forensics.
            </p>

            <p>
              Alongside cybersecurity, I build full-stack applications and
              security tooling using Python, Flask, React, TypeScript, and
              modern web technologies. Working across both disciplines gives me
              an understanding of systems from both sides, from how an
              application or environment is designed to how it can be abused,
              monitored, and investigated.
            </p>
          </div>
        </div>

        {/* Supporting expertise — ~30% */}
        <div className="lg:w-[50%] lg:shrink-0">
          <div className="space-y-3">
            {expertise.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-lg border border-line bg-bg/30 px-4 py-3 transition-all duration-300 hover:bg-line/5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 7px ${item.color}70`,
                    }}
                  />

                  <div>
                    <h3 className="font-mono text-xs font-semibold text-ink sm:text-sm">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 text-[11px] leading-[1.7] text-mute sm:text-xs">
                      {item.description}
                    </p>
                  </div>
                </div>

                <span
                  className="absolute bottom-0 left-4 h-px w-0 transition-all duration-300 group-hover:w-10"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-phos/50">{term}</dt>
      <dd className="mt-1.5 leading-relaxed text-ink/80">{value}</dd>
    </div>
  );
}

export function SectionLabel({
  index,
  title,
}: {
  index: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs text-mute">
      <span className="text-phos-dim">{index}</span>
      <span className="h-px flex-1 bg-line" />
      <span className="uppercase tracking-widest">{title}</span>
    </div>
  );
}
