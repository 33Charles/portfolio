import { useEffect, useState } from "react";
import { ForensightOverlay } from "./ForensightOverlay";

type Project = {
  title: string;
  category: string;
  description: string;
  tags: string[];
  link: string;
};

const projects: Project[] = [
  {
    title: "Web Application Security Assessment",
    category: "Offensive Security",
    description:
      "Practical assessment covering reconnaissance, enumeration, vulnerability discovery, exploitation, and impact analysis.",
    tags: ["Burp Suite", "Nmap", "ffuf"],
    link: "#",
  },
  {
    title: "Active Directory Attack Path",
    category: "Offensive Security",
    description:
      "Hands-on assessment of an Active Directory environment involving enumeration, credential attacks, privilege escalation, and lateral movement.",
    tags: ["BloodHound", "Impacket", "NetExec"],
    link: "#",
  },
];

export default function Projects() {
  const [forensightOpen, setForensightOpen] = useState(false);

  useEffect(() => {
    if (!forensightOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setForensightOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [forensightOpen]);

  return (
    <>
      <section id="projects" className="bg-bg px-5 py-24">
        <div className="mx-auto max-w-6xl">
          {/* Section label */}
          <div className="flex items-center gap-3 font-mono text-xs text-mute">
            <span className="text-phos-dim">03</span>
            <span className="h-px flex-1 bg-line" />
            <span className="uppercase tracking-widest">projects</span>
          </div>

          {/* Heading */}
          <div className="mt-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-phos/70 sm:text-3xl">
              Selected Work
            </h2>

            <p className="mt-4 text-sm leading-[1.8] text-mute sm:text-base">
              Security tooling, research, and applications built through
              practical experimentation and hands-on development.
            </p>
          </div>

          {/* Featured Forensight project */}
          <article className="group relative mt-12 overflow-hidden rounded-xl border border-line bg-black/30">
            {/* Top accent */}
            <div className="absolute left-0 top-0 h-px w-24 bg-phos/40 transition-all duration-500 group-hover:w-40 group-hover:bg-phos" />

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-phos/50">
                    <span>Featured Project</span>
                    <span className="h-px w-8 bg-phos/20" />
                    <span>01</span>
                  </div>

                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                    FORENSIGHT
                  </h3>

                  <p className="mt-2 font-mono text-sm text-phos/70 sm:text-base">
                    Real-Time Log Analysis & Threat Detection System
                  </p>
                </div>

                <span className="w-fit rounded-full border border-phos/20 bg-phos/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-phos/60">
                  Security Tooling
                </span>
              </div>

              <p className="mt-7 max-w-4xl text-sm leading-[1.9] text-slate-300/80 sm:text-base">
                FORENSIGHT is a lightweight Linux-focused security monitoring
                and threat detection system designed to centralize security
                events from multiple hosts, analyze activity against
                configurable detection rules, and provide analysts with a
                real-time workflow for investigating and resolving alerts.
              </p>

              {/* High-level architecture */}
              <div className="mt-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-phos/40">//</span>

                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                    System Flow
                  </h4>

                  <span className="h-px flex-1 bg-line" />
                </div>

                <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-bg/40 p-5">
                  <div className="flex min-w-[720px] items-center justify-center gap-2 font-mono text-[10px] sm:text-xs">
                    <ArchitectureNode label="Linux Hosts" />
                    <Arrow />
                    <ArchitectureNode label="rsyslog / auditd" />
                    <Arrow />
                    <ArchitectureNode label="Flask" />
                    <Arrow />
                    <ArchitectureNode label="Detection" />
                    <Arrow />
                    <ArchitectureNode label="SQLite" />
                    <Arrow />
                    <ArchitectureNode label="React" />
                  </div>
                </div>
              </div>

              {/* Quick technical summary */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <SummaryItem
                  label="Collection"
                  value="rsyslog + auditd"
                />
                <SummaryItem
                  label="Detection"
                  value="Rule-based analysis"
                />
                <SummaryItem
                  label="Interface"
                  value="Real-time React dashboard"
                />
              </div>

              {/* Technologies */}
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  "Python",
                  "Flask",
                  "React",
                  "SQLite",
                  "rsyslog",
                  "auditd",
                  "Flask-SocketIO",
                  "JWT",
                  "MITRE ATT&CK",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-line bg-bg/40 px-3 py-1.5 font-mono text-[10px] text-mute transition-colors hover:border-phos/30 hover:text-phos"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
                <button
                  type="button"
                  onClick={() => setForensightOpen(true)}
                  className="rounded-md border border-phos-dim bg-phos/10 px-4 py-2.5 font-mono text-xs text-phos transition-colors hover:bg-phos hover:text-bg"
                >
                  explore project →
                </button>

                <a
                  href="https://github.com/33Charles/forensight"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-line px-4 py-2.5 font-mono text-xs text-ink transition-colors hover:border-phos-dim hover:text-phos"
                >
                  github ↗
                </a>
              </div>
            </div>
          </article>

          {/* Other projects */}
          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-phos/40">//</span>

              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                Other Projects
              </h3>

              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {projects.map((project, index) => (
                <article
                  key={project.title}
                  className="group relative overflow-hidden rounded-xl border border-line bg-black/20 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-phos/30 hover:bg-black/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-phos/30">
                      0{index + 2}
                    </span>

                    <span className="font-mono text-[9px] uppercase tracking-wider text-mute/60">
                      {project.category}
                    </span>
                  </div>

                  <h3 className="mt-5 font-mono text-sm font-semibold text-ink transition-colors group-hover:text-phos">
                    {project.title}
                  </h3>

                  <p className="mt-3 text-xs leading-[1.8] text-mute">
                    {project.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.tags.map((tag:any) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line px-2.5 py-1 font-mono text-[9px] text-mute"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={project.link}
                    className="mt-6 inline-flex font-mono text-[10px] uppercase tracking-wider text-phos/60 transition-colors hover:text-phos"
                  >
                    explore project →
                  </a>

                  <span className="absolute bottom-0 left-6 h-px w-8 bg-phos/20 transition-all duration-300 group-hover:w-14 group-hover:bg-phos" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {forensightOpen && (
        <ForensightOverlay onClose={() => setForensightOpen(false)} />
      )}
    </>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-bg/30 p-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-phos/40">
        {label}
      </p>

      <p className="mt-2 text-xs text-ink/80">{value}</p>
    </div>
  );
}

function ArchitectureNode({ label }: { label: string }) {
  return (
    <div className="whitespace-nowrap rounded-md border border-line bg-black/50 px-3 py-2 text-mute">
      {label}
    </div>
  );
}
function Arrow() {
  return <span className="shrink-0 text-phos/40">→</span>;
}

