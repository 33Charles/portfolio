import {
  Network,
  Globe,
  Radar,
  Activity,
  MonitorCheck,
  Crosshair,
  FileSearch,
  MemoryStick,
  Code2,
  Server,
  LayoutGrid,
  TerminalSquare,
  AppWindow,
  Cable,
  type LucideIcon,
} from "lucide-react"

// Category accent colors — shared with the skills graph.
const CATEGORY_COLORS: Record<string, string> = {
  "Offensive Security": "#5bd68a",
  "Security Operations": "#e05cff",
  "Digital Forensics": "#ff6b78",
  "Security Tooling & Development": "#5ec8e6",
  "Systems & Networking": "#e6b450",
}

export default function Skills() {
  const skills = [
    {
      category: "Offensive Security",
      description:
        "Assessing systems and applications through reconnaissance and enumeration, exploitation, and attack-path analysis.",
      items: [
        {
          title: "Active Directory",
          level: "Hands-on",
          depth: 3,
          icon: Network,
          description:
            "Active Directory enumeration, authentication and credential attacks, privilege escalation, lateral movement, and domain attack-path analysis.",
        },
        {
          title: "Web Application Security",
          level: "Hands-on",
          depth: 4,
          icon: Globe,
          description:
            "Web reconnaissance and enumeration, attack-surface identification, vulnerability discovery, authentication and session testing, access-control assessment, API security, business-logic testing, and exploitation.",
        },
        {
          title: "Network Security",
          level: "Hands-on",
          depth: 4,
          icon: Radar,
          description:
            "Network reconnaissance and service enumeration, traffic and packet analysis, vulnerability assessment, and network protocol analysis.",
        },
      ],
    },
    {
      category: "Security Operations",
      description:
        "Monitoring, detection, investigation, and analysis of security events across systems and endpoints.",
      items: [
        {
          title: "SOC / SIEM & Log Analysis",
          level: "Hands-on",
          depth: 3,
          icon: Activity,
          description:
            "Security event analysis, log investigation, alert triage, threat detection, and incident investigation using Splunk and ELK.",
        },
        {
          title: "Endpoint Monitoring",
          level: "Hands-on",
          depth: 2,
          icon: MonitorCheck,
          description:
            "Windows telemetry, Sysmon events, process activity, event-log analysis, and investigation of suspicious system behavior.",
        },
        {
          title: "Threat Detection & Hunting",
          level: "Hands-on",
          depth: 3,
          icon: Crosshair,
          description:
            "Security-event investigation, behavioral analysis, threat hunting, detection logic, and identification of suspicious activity.",
        },
      ],
    },
    {
      category: "Digital Forensics",
      description:
        "Examining system artifacts, memory, and logs to reconstruct activity and investigate security incidents.",
      items: [
        {
          title: "Windows Forensics",
          level: "Hands-on",
          depth: 2,
          icon: FileSearch,
          description:
            "Windows event logs, filesystem artifacts, MFT analysis, registry artifacts, and investigation of system activity and user actions.",
        },
        {
          title: "Memory Forensics",
          level: "Hands-on",
          depth: 2,
          icon: MemoryStick,
          description:
            "Memory acquisition and analysis, process and network investigation, suspicious process identification, and artifact extraction.",
        },
      ],
    },
    {
      category: "Security Tooling & Development",
      description:
        "Building practical applications and automation that support security testing, monitoring, analysis, and investigation.",
      items: [
        {
          title: "Python",
          level: "Project Experience",
          depth: 4,
          icon: Code2,
          description: "Security automation and scripting.",
        },
        {
          title: "Flask & REST APIs",
          level: "Project Experience",
          depth: 4,
          icon: Server,
          description:
            "Backend services, REST API design, authentication, database integration, and real-time application workflows.",
        },
        {
          title: "Web Development",
          level: "Project Experience",
          depth: 3,
          icon: LayoutGrid,
          description:
            "Building full-stack web applications, from designing user interfaces and application logic to integrating APIs, databases, and authentication.",
        },
      ],
    },
    {
      category: "Systems & Networking",
      description:
        "Working across Linux and Windows environments while understanding the networking and system foundations that support them.",
      items: [
        {
          title: "Linux",
          level: "Hands-on",
          depth: 3,
          icon: TerminalSquare,
          description:
            "Linux administration, system services, networking, logging, permissions, and process management.",
        },
        {
          title: "Windows",
          level: "Hands-on",
          depth: 2,
          icon: AppWindow,
          description:
            "Windows administration, event logging, Active Directory environments, endpoint telemetry, and security investigation.",
        },
        {
          title: "Networking",
          level: "Hands-on",
          depth: 4,
          icon: Cable,
          description:
            "TCP/IP, DNS, HTTP, routing, network enumeration, packet analysis, and troubleshooting.",
        },
      ],
    },
  ]

  return (
    <section id="skills" className="bg-black/25 px-5 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section label */}
        <div className="flex items-center gap-3 font-mono text-xs text-mute">
          <span className="text-phos-dim">02</span>
          <span className="h-px flex-1 bg-line" />
          <span className="uppercase tracking-widest">skills</span>
        </div>

        {/* Heading */}
        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-phos/70 sm:text-3xl">
          Technical Skills
        </h2>

        {/* Main capability cards */}
        <div className="mt-12 space-y-6">
          {skills.map((group, groupIdx) => {
            const color = CATEGORY_COLORS[group.category] ?? "#5bd68a"

            return (
              <section
                key={group.category}
                className="relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.035] via-black/20 to-black/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6"
                style={{
                  borderColor: `${color}30`,
                }}
              >
                {/* Subtle category-colored ambient tint */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${color}0b, transparent 55%)`,
                  }}
                />

                {/* Category header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />

                    <span className="font-mono text-[10px] text-mute">
                      {String(groupIdx + 1).padStart(2, "0")}
                    </span>

                    <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-ink">
                      {group.category}
                    </h3>
                  </div>

                  <p className="mt-3 font-mono text-xs leading-[1.8] text-mute sm:text-sm">
                    <span style={{ color: `${color}99` }}>
                      {"// "}
                    </span>
                    {group.description}
                  </p>
                </div>

                {/* Nested skill cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((skill) => {
                    const isHandsOn = skill.level === "Hands-on"
                    const Icon: LucideIcon = skill.icon

                    return (
                      <article
                        key={skill.title}
                        className="group relative isolate overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.025] via-black/25 to-black/15 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-white/[0.025] hover:shadow-[0_8px_24px_-18px_var(--accent)]"
                        style={{
                          ["--accent" as string]: color,
                        }}
                      >
                        {/* Skill header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                              style={{
                                color,
                                backgroundColor: `${color}1a`,
                                border: `1px solid ${color}40`,
                              }}
                            >
                              <Icon
                                size={15}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                            </span>

                            <h4 className="font-mono text-sm font-medium leading-snug text-ink transition-colors duration-200 group-hover:text-[var(--accent)]">
                              {skill.title}
                            </h4>
                          </div>

                          {/* Experience badge */}
                          <span
                            className="shrink-0 rounded-md px-2 py-1 font-mono text-[9px] uppercase tracking-wider"
                            style={
                              isHandsOn
                                ? {
                                    color,
                                    backgroundColor: `${color}1a`,
                                    border: `1px solid ${color}55`,
                                  }
                                : {
                                    color: "var(--color-mute)",
                                    backgroundColor: "rgba(255,255,255,0.02)",
                                    border: "1px solid var(--color-line)",
                                  }
                            }
                          >
                            {skill.level}
                          </span>
                        </div>

                        {/* Skill depth indicator */}
                        <div
                          className="mt-4 flex items-center gap-1"
                          aria-hidden="true"
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="h-1 w-5 rounded-full"
                              style={{
                                backgroundColor:
                                  i < skill.depth
                                    ? color
                                    : "var(--color-line)",
                                opacity: i < skill.depth ? 0.9 : 0.45,
                              }}
                            />
                          ))}
                        </div>

                        {/* Skill description */}
                        <p className="mt-4 text-xs leading-[1.8] text-mute">
                          {skill.description}
                        </p>

                        {/* Bottom accent */}
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 left-5 h-px w-0 transition-all duration-300 group-hover:w-10"
                          style={{ backgroundColor: color }}
                        />
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}