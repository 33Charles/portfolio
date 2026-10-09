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
    title: "Notely",
    category: "Full-Stack Development",
    description:
      "A full-stack note-taking and article-publishing platform built with React, TypeScript, and Node.js. Users can create and edit notes, publish public or private content, bookmark and pin notes, manage deleted content, customize account settings, and follow other users. The application includes authentication, profile management, and a dedicated REST API.",
    tags: [
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "Prisma",
      "PostgreSQL",
      "REST API",
      "JWT Authentication",
    ],
    link: "https://notely-gray.vercel.app/",
  },
  {
    title: "PluseFit",
    category: "Web Development",
    description:
      "A modern, responsive gym and fitness website featuring workout programs for weight loss, yoga, strength training, rehabilitation, and endurance. Includes tiered membership plans, trainer profiles, member testimonials, and dedicated gym information pages, built with React, TypeScript, and Tailwind CSS.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    link: "https://pluse-fit.vercel.app/",
  },
  {
    title: "Maasai BeadWork",
    category: "Full-Stack Development",
    description:
      "A full-stack e-commerce platform for Maasai beadwork, enabling customers to browse and purchase handcrafted products while providing a marketplace for selling beadwork. Built with React, TypeScript, and an Express backend with Prisma ORM and database integration.",
    tags: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Express",
      "Prisma",
      "PostgreSQL",
    ],
    link: "https://github.com/33Charles/maasaiBeadWork",
  },

  {
    title: "ZaphTours",
    category: "Web Development",
    description:
      "A responsive travel and tourism website for exploring destinations and tour packages. Features destination showcases, categorized travel experiences, individual and group pricing, featured tours, testimonials, and contact options to help visitors discover and inquire about travel experiences.",
    tags: ["React", "TypeScript", "Vite", "Material UI", "React Router"],
    link: "https://zaph-tours-six-vert.vercel.app/",
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
      <section id="projects" className="bg-bg px-5 py-20 ">
        <div className="mx-auto max-w-7xl">

          <div className="mt-10 max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-phos" />
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-phos">
                What I've Built
              </span>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Selected <span className="text-phos">Projects</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-mute sm:text-base">
              Security tools, investigative work, and software applications
              developed through hands-on experimentation and practical
              problem-solving.
            </p>
          </div>

          {/* Featured Forensight project */}
          <article className="relative isolate mt-12 overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.04] via-[#0b0e0c]/90 to-[#080a09] shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_16px_50px_-30px_rgba(0,0,0,0.8)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(91,214,138,0.055),transparent_55%)]"
            />

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-phos/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-phos/80" />
                    <span>Featured Project</span>
                    <span className="h-px w-8 bg-phos/25" />
                    <span>01</span>
                  </div>

                  <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-ink sm:text-3xl">
                    FORENSIGHT<span className="text-phos">.</span>
                  </h3>

                  <p className="mt-2 font-mono text-xs leading-6 tracking-wide text-phos/75 sm:text-sm">
                    Real-Time Log Analysis & Threat Detection System
                  </p>
                </div>

   
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-phos/20 bg-phos/[0.08] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-phos/90">
                  <span className="h-1 w-1 rounded-full bg-phos" />
                  Security Tooling
                </span>
              </div>
              <p className="mt-7 max-w-4xl text-sm leading-[1.9] text-ink/80 sm:text-base">
                FORENSIGHT is a lightweight Linux-focused security monitoring
                and threat detection system designed to centralize security
                events from multiple hosts, analyze activity against
                configurable detection rules, and provide analysts with a
                real-time workflow for investigating and resolving alerts.
              </p>

              <div className="mt-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-phos/50">//</span>

                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                    System Flow
                  </h4>

                  <span className="h-px flex-1 bg-line" />
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex min-w-[720px] items-center justify-center gap-2 font-mono text-[10px] sm:text-xs">
                    <ArchitectureNode label="Linux Hosts" />
                    <FlowArrow delay={0} />
                    <ArchitectureNode label="rsyslog / auditd" />
                    <FlowArrow delay={0.3} />
                    <ArchitectureNode label="Flask" />
                    <FlowArrow delay={0.6} />
                    <ArchitectureNode label="Detection" />
                    <FlowArrow delay={0.9} />
                    <ArchitectureNode label="SQLite" />
                    <FlowArrow delay={1.2} />
                    <ArchitectureNode label="React" />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <SummaryItem label="Collection" value="rsyslog + auditd" />

                <SummaryItem label="Detection" value="Rule-based analysis" />

                <SummaryItem
                  label="Interface"
                  value="Real-time React dashboard"
                />
              </div>

  
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  "Python",
                  "Flask",
                  "React",
                  "Bash",
                  "SQLite",
                  "rsyslog",
                  "auditd",
                  "Flask-SocketIO",
                  "JWT",
                  "MITRE ATT&CK",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-mute/90"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-6">
                <button
                  type="button"
                  onClick={() => setForensightOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-phos/25 bg-phos/[0.08] px-4 py-2.5 font-mono text-xs font-medium text-phos shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
                >
                  Explore project
                  <span>↗</span>
                </button>

                <a
                  href="https://github.com/33Charles/forensight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.025] px-4 py-2.5 font-mono text-xs text-ink/80"
                >
                  GitHub
                  <span className="text-phos/80">↗</span>
                </a>
              </div>
            </div>
          </article>

          {/* Other Projects */}
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight text-ink">
                  Other <span className="text-phos">Projects</span>
                </h3>
              </div>

              <span className="font-mono text-[10px] text-mute/50">
                {String(projects.length).padStart(2, "0")} projects
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project, index) => (
                <article
                  key={project.title}
                  className="group relative isolate overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.035] via-black/20 to-black/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-phos/30 hover:bg-white/[0.025] hover:shadow-[0_0_20px_-12px_rgba(91,214,138,0.35)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(91,214,138,0.045),transparent_60%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(91,214,138,0.09),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <div className="relative flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] text-phos/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-phos/20 bg-phos/[0.08] px-3 py-1.5 font-mono text-[9px] font-medium uppercase tracking-wider text-phos/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm transition-colors duration-300 group-hover:border-phos/35 group-hover:bg-phos/[0.12]">
                      <span className="h-1 w-1 rounded-full bg-phos shadow-[0_0_5px_rgba(91,214,138,0.5)]" />
                      {project.category}
                    </span>
                  </div>

                  <h4 className="relative mt-5 text-2xl font-semibold leading-snug tracking-tight text-ink transition-colors duration-300 group-hover:text-white">
                    {project.title}
                  </h4>

                  <p className="relative mt-2 text-sm leading-6 text-mute/80">
                    {project.description}
                  </p>

                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/[0.06] bg-white/[0.035] px-2 py-1 font-mono text-[9px] text-mute/90 backdrop-blur-sm transition-all duration-300 group-hover:border-white/[0.1] group-hover:bg-white/[0.05]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3 transition-colors duration-300 group-hover:border-phos/15">
                    <span className="text-[9px] text-mute/45">
                      Project {String(index + 1).padStart(2, "0")}
                    </span>
                    <a
                      href={project.link}
                      target={
                        project.link.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        project.link.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      aria-label={`Explore ${project.title}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-phos/25 bg-phos/[0.07] px-3 py-2 font-mono text-[10px] font-medium text-phos transition-all duration-300 hover:border-phos/50 hover:bg-phos/[0.14] hover:shadow-[0_0_14px_-6px_rgba(91,214,138,0.4)]"
                    >
                      Explore project
                      <span className="text-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        ↗
                      </span>
                    </a>
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-5 bottom-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-phos/60 to-transparent transition-transform duration-500 group-hover:scale-x-100"
                  />
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      {forensightOpen && (
        <ForensightOverlay onClose={() => setForensightOpen(false)} />
      )}
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
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

function FlowArrow({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flow-arrow"
      style={{ ["--flow-delay" as string]: `${delay}s` }}
      aria-hidden="true"
    >
      <span className="flow-arrow__head" />
    </div>
  );
}
