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
          description:
            "Active Directory enumeration, authentication and credential attacks, privilege escalation, lateral movement, and domain attack-path analysis.",
        },
        {
          title: "Web Application Security",
          level: "Hands-on",
          description:
            "Web reconnaissance and enumeration, attack-surface identification, vulnerability discovery, authentication and session testing, access-control assessment, API security, business-logic testing, and exploitation.",
        },
        {
          title: "Network Security",
          level: "Hands-on",
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
          description:
            "Security event analysis, log investigation, alert triage, threat detection, and incident investigation using Splunk and ELK.",
        },
        {
          title: "Endpoint Monitoring",
          level: "Hands-on",
          description:
            "Windows telemetry, Sysmon events, process activity, event-log analysis, and investigation of suspicious system behavior.",
        },
        {
          title: "Threat Detection & Hunting",
          level: "Hands-on",
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
          description:
            "Windows event logs, filesystem artifacts, MFT analysis, registry artifacts, and investigation of system activity and user actions.",
        },
        {
          title: "Memory Forensics",
          level: "Hands-on",
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
          description:
            "Security automation and scripting.",
        },
        {
          title: "Flask & REST APIs",
          level: "Project Experience",
          description:
            "Backend services, REST API design, authentication, database integration, and real-time application workflows.",
        },
        {
          title: "Web Development",
          level: "Project Experience",
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
          description:
            "Linux administration, system services, networking, logging, permissions and process management",
        },
        {
          title: "Windows",
          level: "Hands-on",
          description:
            "Windows administration, event logging, Active Directory environments, endpoint telemetry, and security investigation.",
        },
        {
          title: "Networking",
          level: "Hands-on",
          description:
            "TCP/IP, DNS, HTTP, routing, network enumeration, packet analysis, and troubleshooting.",
        },
      ],
    },
  ];

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
          {skills.map((group) => (
            <section
              key={group.category}
              className="rounded-xl border border-line bg-bg/10 p-5 sm:p-6"
            >
              {/* Main card header */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-phos/40">
                    //
                  </span>

                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-ink">
                    {group.category}
                  </h3>

                  
                </div>

                <p className="mt-3 max-w-3xl text-xs leading-[1.8] text-mute sm:text-sm">
                  {group.description}
                </p>
              </div>

              {/* Nested skill cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((skill) => (
                  <article
                    key={skill.title}
                    className="group relative rounded-lg border border-line bg-black/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-phos/30 hover:bg-black/50"
                  >
                    {/* Skill header */}
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-mono text-sm font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-phos">
                        {skill.title}
                      </h4>

                      <span className="shrink-0 rounded-md border border-phos/20  px-2 py-1 font-mono text-[9px] uppercase tracking-wider">
                        {skill.level}
                      </span>
                    </div>

                    {/* Skill description */}
                    <p className="mt-4 text-xs leading-[1.8] text-mute">
                      {skill.description}
                    </p>

                    {/* Bottom accent */}
                    <span className="absolute bottom-0 left-5 h-px w-0 bg-phos transition-all duration-300 group-hover:w-12" />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}