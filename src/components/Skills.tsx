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

// Category accent colors — reuses the same palette as the skills graph, so this
// section and that one read as two views of the same information.
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
            "Network reconnaissance and service enumeration, traffic and packet analysis, vulnerability assessment, and network protocol analysis",
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
            "Memory acquisition and analysis, process and network investigation, suspicious process identification, and artifact extraction",
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
            "Linux administration, system services, networking, logging, permissions and process management",
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
                className="rounded-xl border border-line bg-bg/10 p-5 sm:p-6"
                style={{ border: `2px solid ${color}55` }}
              >
                {/* Main card header */}
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

                  <p className="mt-3 max-w-3xl font-mono text-xs leading-[1.8] text-mute sm:text-sm">
                    <span style={{ color: `${color}99` }}>{"// "}</span>
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
                        className="group relative rounded-lg border border-line bg-black/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black/50"
                        style={{ ["--accent" as string]: color }}
                      >
                        {/* Skill header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200"
                              style={{
                                color,
                                backgroundColor: `${color}1a`,
                                border: `1px solid ${color}40`,
                              }}
                            >
                              <Icon size={14} strokeWidth={2} aria-hidden="true" />
                            </span>

                            <h4 className="font-mono text-sm font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-[var(--accent)]">
                              {skill.title}
                            </h4>
                          </div>

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
                                    backgroundColor: "transparent",
                                    border: "1px solid var(--color-line)",
                                  }
                            }
                          >
                            {skill.level}
                          </span>
                        </div>

                        {/* Depth indicator — placeholder, tune per skill via the `depth` field above */}
                        <div className="mt-3 flex items-center gap-1" aria-hidden="true">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="h-1 w-4 rounded-full"
                              style={{
                                backgroundColor: i < skill.depth ? color : "var(--color-line)",
                                opacity: i < skill.depth ? 0.9 : 0.5,
                              }}
                            />
                          ))}
                        </div>

                        {/* Skill description */}
                        <p className="mt-4 text-xs leading-[1.8] text-mute">{skill.description}</p>

                        {/* Bottom accent */}
                        <span
                          className="absolute bottom-0 left-5 h-px w-0 transition-all duration-300 group-hover:w-12"
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