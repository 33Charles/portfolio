import { useEffect, useState } from "react";

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
                    {project.tags.map((tag) => (
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


/* -------------------------------------------------------------------------- */
/*                           FORENSIGHT OVERLAY                              */
/* -------------------------------------------------------------------------- */

function ForensightOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forensight-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="h-full overflow-y-auto">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-line bg-black/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
              <span className="text-phos">FORENSIGHT</span>
              <span className="text-mute">/</span>
              <span className="text-mute">PROJECT 01</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Forensight project"
              className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mute transition-colors hover:text-phos"
            >
              <span>close</span>
              <span className="text-base leading-none text-phos/50 transition-colors group-hover:text-phos">
                ×
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          {/* Hero */}
          <section>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-phos/50">
              <span>Featured Project</span>
              <span className="h-px w-8 bg-phos/20" />
              <span>Security Tooling</span>
            </div>

            <h1
              id="forensight-title"
              className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl"
            >
              FORENSIGHT
            </h1>

            <p className="mt-3 max-w-3xl font-mono text-base leading-relaxed text-phos/70 sm:text-lg">
              Real-Time Log Analysis & Threat Detection System
            </p>

            <p className="mt-7 max-w-3xl text-sm leading-[1.9] text-slate-300/80 sm:text-base">
              A lightweight Linux-focused security monitoring system built to
              collect security-relevant events from multiple hosts, normalize
              incoming telemetry, identify suspicious behavior through
              configurable detection rules, and provide a centralized
              interface for security investigation.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
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
                  className="rounded-full border border-line bg-bg/30 px-3 py-1.5 font-mono text-[10px] text-mute"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="https://github.com/33Charles/forensight"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-phos-dim bg-phos/10 px-4 py-2.5 font-mono text-xs text-phos transition-colors hover:bg-phos hover:text-bg"
              >
                view repository ↗
              </a>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-line px-4 py-2.5 font-mono text-xs text-mute transition-colors hover:border-phos/30 hover:text-phos"
              >
                back to projects
              </button>
            </div>
          </section>

          <div className="my-14 h-px bg-line" />

          {/* 01 Overview */}
          <CaseStudySection number="01" title="Overview">
            <p>
              FORENSIGHT was developed as a lightweight security monitoring
              platform for Linux environments. The system receives events from
              multiple hosts, processes and normalizes those events, evaluates
              them against detection logic, stores the resulting data, and
              presents security-relevant activity through a centralized React
              dashboard.
            </p>

            <p>
              The project combines concepts from SIEM, security operations,
              threat detection, and incident investigation while keeping the
              implementation small enough to understand and modify end to end.
            </p>
          </CaseStudySection>

          {/* 02 Problem */}
          <CaseStudySection number="02" title="Problem">
            <p>
              Security events generated by individual Linux systems can become
              difficult to investigate when they are distributed across several
              hosts and different log sources. Reviewing each system
              independently also makes it harder to identify recurring patterns
              or correlate activity.
            </p>

            <p>
              The project therefore focused on building a centralized workflow
              capable of answering three practical questions:
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <QuestionCard
                number="01"
                title="What happened?"
                description="Collect and normalize security-relevant system and network events."
              />

              <QuestionCard
                number="02"
                title="Is it suspicious?"
                description="Evaluate incoming activity against configurable detection rules."
              />

              <QuestionCard
                number="03"
                title="What should happen next?"
                description="Provide enough context for an analyst to investigate and resolve the alert."
              />
            </div>
          </CaseStudySection>

          {/* 03 Architecture */}
          <CaseStudySection number="03" title="Architecture">
            <p>
              The system follows a pipeline architecture. Linux hosts generate
              telemetry through standard logging and auditing mechanisms. Events
              are forwarded to the centralized backend, processed by the
              ingestion and detection layers, persisted in the database, and
              exposed to the frontend through REST and real-time communication.
            </p>

            <ArchitectureDiagram />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <TechnicalBlock
                title="Collection Layer"
                description="rsyslog forwards centralized Linux log events over TCP, while auditd provides host-level auditing for security-sensitive activity."
              />

              <TechnicalBlock
                title="Processing Layer"
                description="The Flask backend receives incoming events, decodes relevant information, normalizes timestamps and event fields, and passes data into the detection pipeline."
              />

              <TechnicalBlock
                title="Detection Layer"
                description="Configurable YAML-based rules allow security-relevant patterns to be identified without embedding every detection directly into application logic."
              />

              <TechnicalBlock
                title="Presentation Layer"
                description="React provides the analyst interface while Flask-SocketIO delivers newly processed events to connected clients in real time."
              />
            </div>
          </CaseStudySection>

          {/* 04 Data flow */}
          <CaseStudySection number="04" title="Event Processing">
            <p>
              A typical event moves through several stages before becoming
              visible as an alert or investigation item.
            </p>

            <div className="mt-6 space-y-2">
              <PipelineStep
                number="01"
                title="Event Generation"
                description="A Linux host generates an authentication, audit, firewall, or other security-relevant event."
              />

              <PipelineStep
                number="02"
                title="Forwarding"
                description="rsyslog forwards applicable events to the centralized receiver over TCP."
              />

              <PipelineStep
                number="03"
                title="Parsing & Normalization"
                description="The backend extracts relevant fields and converts events into a consistent internal representation."
              />

              <PipelineStep
                number="04"
                title="Detection"
                description="The normalized event is evaluated against the configured detection rules."
              />

              <PipelineStep
                number="05"
                title="Persistence"
                description="Events and generated alerts are stored in SQLite together with their associated metadata."
              />

              <PipelineStep
                number="06"
                title="Real-Time Delivery"
                description="Relevant updates are emitted to connected dashboard clients through Flask-SocketIO."
              />

              <PipelineStep
                number="07"
                title="Investigation"
                description="An analyst reviews the alert, assigns the investigation, records findings, and resolves or reopens the case."
              />
            </div>
          </CaseStudySection>

          {/* 05 Detection */}
          <CaseStudySection number="05" title="Detection Engineering">
            <p>
              Detection logic was designed around security-relevant behaviors
              rather than simply displaying raw log entries. The detection
              layer evaluates normalized events and generates alerts when
              configured conditions are met.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetectionCard
                title="Brute-Force Activity"
                description="Authentication events are evaluated for repeated failed attempts that match the configured detection criteria."
              />

              <DetectionCard
                title="Port Scanning"
                description="Network reconnaissance activity can be surfaced through firewall events generated for inbound scanning behavior."
              />

              <DetectionCard
                title="Reverse-Shell Activity"
                description="Patterns associated with reverse-shell behavior can be identified and surfaced for analyst investigation."
              />

              <DetectionCard
                title="Privilege Escalation"
                description="Security-relevant activity associated with attempts to obtain elevated privileges can be represented as detection events."
              />

              <DetectionCard
                title="Sensitive File Access"
                description="auditd monitors access to security-sensitive files including /etc/passwd, /etc/shadow, and /etc/sudoers."
              />

              <DetectionCard
                title="Suspicious System Activity"
                description="Additional system-level activity can be evaluated through configurable rules as the detection set evolves."
              />
            </div>
          </CaseStudySection>

          {/* 06 ATT&CK */}
          <CaseStudySection number="06" title="MITRE ATT&CK Mapping">
            <p>
              Detection results can be associated with relevant MITRE ATT&CK
              techniques to provide additional context around the behavior
              represented by an alert.
            </p>

            <p>
              Rather than treating an alert as an isolated event, ATT&CK
              mapping provides a common language for describing the adversary
              behavior represented by the detection.
            </p>

            <div className="mt-6 rounded-lg border border-line bg-black/40 p-5 font-mono text-xs">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <span className="text-phos/40">TACTIC</span>
                  <p className="mt-2 text-ink/80">Credential Access</p>
                </div>

                <div>
                  <span className="text-phos/40">BEHAVIOR</span>
                  <p className="mt-2 text-ink/80">Brute Force</p>
                </div>

                <div>
                  <span className="text-phos/40">CONTEXT</span>
                  <p className="mt-2 text-ink/80">
                    Authentication activity
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-mute">
              The exact techniques displayed by the application depend on the
              detection rules implemented in the current version.
            </p>
          </CaseStudySection>

          {/* 07 Investigation */}
          <CaseStudySection number="07" title="Investigation Workflow">
            <p>
              Detection is only useful when an analyst can act on the resulting
              alert. FORENSIGHT therefore includes an investigation workflow
              around generated alerts.
            </p>

            <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-black/40 p-5">
              <div className="flex min-w-[650px] items-center justify-center gap-3 font-mono text-[10px] sm:text-xs">
                <WorkflowNode label="Event" />
                <Arrow />
                <WorkflowNode label="Detection" />
                <Arrow />
                <WorkflowNode label="Alert" />
                <Arrow />
                <WorkflowNode label="Investigation" />
                <Arrow />
                <WorkflowNode label="Resolution" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TechnicalBlock
                title="Role-Based Access"
                description="The dashboard supports administrative, analyst, and viewer roles with different levels of access."
              />

              <TechnicalBlock
                title="Investigation Locking"
                description="An investigation can be locked while an analyst is actively working on it, reducing conflicting updates."
              />

              <TechnicalBlock
                title="Assignment"
                description="Alerts can be assigned to analysts so ownership of an investigation is explicit."
              />

              <TechnicalBlock
                title="Resolution Trail"
                description="Investigations can be resolved with notes and subsequently reopened when additional analysis is required."
              />
            </div>
          </CaseStudySection>

          {/* 08 Technical implementation */}
          <CaseStudySection number="08" title="Technical Implementation">
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-black/40">
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-phos/50">
                      Component
                    </th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-phos/50">
                      Purpose
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <TechRow
                    component="Python"
                    purpose="Backend logic, event processing, detection and automation."
                  />
                  <TechRow
                    component="Flask"
                    purpose="REST API and core application backend."
                  />
                  <TechRow
                    component="Flask-SQLAlchemy"
                    purpose="Database models and persistence layer."
                  />
                  <TechRow
                    component="Flask-JWT-Extended"
                    purpose="Authentication and token-based authorization."
                  />
                  <TechRow
                    component="Flask-SocketIO"
                    purpose="Real-time event delivery to connected dashboard clients."
                  />
                  <TechRow
                    component="SQLite"
                    purpose="Storage for events, alerts, investigations and related metadata."
                  />
                  <TechRow
                    component="React"
                    purpose="Interactive analyst dashboard and application interface."
                  />
                  <TechRow
                    component="rsyslog"
                    purpose="Centralized forwarding of Linux log events."
                  />
                  <TechRow
                    component="auditd"
                    purpose="Host-level auditing and security-sensitive event collection."
                  />
                  <TechRow
                    component="iptables"
                    purpose="Generation of relevant network security events."
                  />
                  <TechRow
                    component="YAML"
                    purpose="Configurable detection-rule definitions."
                  />
                </tbody>
              </table>
            </div>
          </CaseStudySection>

          {/* 09 Engineering decisions */}
          <CaseStudySection number="09" title="Engineering Decisions">
            <div className="space-y-5">
              <Decision
                title="Why rsyslog?"
                description="It provides a straightforward mechanism for forwarding Linux logs from multiple hosts without requiring a heavyweight agent architecture."
              />

              <Decision
                title="Why auditd?"
                description="System logs alone do not provide every security-relevant signal. auditd adds host-level auditing for activities such as system calls and access to sensitive files."
              />

              <Decision
                title="Why YAML detection rules?"
                description="Separating detection definitions from application logic makes it easier to modify or add rules without restructuring the processing pipeline."
              />

              <Decision
                title="Why WebSockets?"
                description="Security monitoring benefits from immediate visibility. Flask-SocketIO allows newly processed events to reach the dashboard without requiring continuous manual refreshes."
              />

              <Decision
                title="Why SQLite?"
                description="For a lightweight research and learning platform, SQLite keeps deployment simple while still providing relational storage for events, alerts and investigations."
              />
            </div>
          </CaseStudySection>

          {/* 10 Security */}
          <CaseStudySection number="10" title="Security & Access Control">
            <p>
              Because the monitoring application itself handles security
              events, authentication and access control are part of the
              implementation rather than an afterthought.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "JWT-based authentication",
                "Role-based access control",
                "Protected API endpoints",
                "Investigation ownership",
                "Investigation locking",
                "Resolution and audit trail",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-line bg-black/30 px-4 py-3"
                >
                  <span className="text-phos/50">✓</span>
                  <span className="text-xs text-mute">{item}</span>
                </div>
              ))}
            </div>
          </CaseStudySection>

          {/* 11 Results */}
          <CaseStudySection number="11" title="Results">
            <p>
              The completed system provides a centralized workflow for
              collecting, processing, detecting, and investigating security
              events across multiple Linux hosts.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Multi-host event collection",
                "Real-time event processing",
                "Rule-based threat detection",
                "Host auditing with auditd",
                "Network event monitoring",
                "MITRE ATT&CK context",
                "Alert investigation",
                "Role-based dashboard access",
                "CSV event export",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-line bg-black/30 px-4 py-3"
                >
                  <span className="font-mono text-[10px] text-phos">✓</span>
                  <p className="mt-2 text-xs text-mute">{item}</p>
                </div>
              ))}
            </div>
          </CaseStudySection>

          {/* 12 Limitations */}
          <CaseStudySection number="12" title="Limitations">
            <p>
              FORENSIGHT is a learning and research project rather than a
              production SIEM. Its detection capabilities are intentionally
              focused on a defined set of Linux security events and
              rule-based behaviors.
            </p>

            <p>
              The platform does not attempt to reproduce the scale, distributed
              architecture, detection ecosystem, or data-processing capabilities
              of enterprise SIEM platforms.
            </p>

            <p>
              These constraints are intentional: the project focuses on
              understanding the underlying mechanics of collection, detection,
              investigation, and security monitoring.
            </p>
          </CaseStudySection>

          {/* 13 Future work */}
          <CaseStudySection number="13" title="Future Work">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Expand the detection-rule library",
                "Improve event correlation",
                "Introduce additional telemetry sources",
                "Add richer investigation context",
                "Improve detection testing and validation",
                "Containerize deployment",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-line bg-black/30 px-4 py-3 text-xs text-mute"
                >
                  {item}
                </div>
              ))}
            </div>
          </CaseStudySection>

          {/* 14 Lessons */}
          <CaseStudySection number="14" title="What I Learned">
            <p>
              Building FORENSIGHT provided practical experience with the
              problems behind security monitoring systems: collecting
              heterogeneous telemetry, normalizing events, designing detection
              logic, handling real-time data, and presenting enough context for
              an analyst to investigate an alert.
            </p>

            <p>
              The project also reinforced the relationship between offensive
              and defensive security. Understanding how reconnaissance,
              credential attacks, privilege escalation, and other behaviors
              appear at the system and network level directly influenced the
              detection concepts implemented in the platform.
            </p>
          </CaseStudySection>

          {/* Repository */}
          <section className="mt-16 border-t border-line pt-10">
            <div className="rounded-xl border border-phos/20 bg-phos/5 p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-phos/50">
                Repository
              </p>

              <h2 className="mt-3 text-xl font-semibold text-ink">
                Explore the implementation
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-[1.8] text-mute">
                The GitHub repository contains the source code, setup
                instructions, implementation details, screenshots, detection
                rules, and project documentation.
              </p>

              <a
                href="https://github.com/33Charles/forensight"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-md border border-phos-dim bg-phos/10 px-4 py-2.5 font-mono text-xs text-phos transition-colors hover:bg-phos hover:text-bg"
              >
                open github repository ↗
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              CASE STUDY UI                                */
/* -------------------------------------------------------------------------- */

function CaseStudySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 first:mt-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-phos/50">{number}</span>

        <span className="h-px w-6 bg-phos/20" />

        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-ink">
          {title}
        </h2>

        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-6 space-y-5 text-sm leading-[1.9] text-slate-300/80">
        {children}
      </div>
    </section>
  );
}

function TechnicalBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-black/30 p-5">
      <h3 className="font-mono text-xs font-semibold text-ink">{title}</h3>

      <p className="mt-3 text-xs leading-[1.8] text-mute">{description}</p>
    </div>
  );
}

function QuestionCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-black/30 p-5">
      <span className="font-mono text-[10px] text-phos/40">{number}</span>

      <h3 className="mt-3 font-mono text-xs font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-[1.8] text-mute">{description}</p>
    </div>
  );
}

function DetectionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-lg border border-line bg-black/30 p-5 transition-colors hover:border-phos/25">
      <div className="flex items-start gap-3">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-phos/60" />

        <div>
          <h3 className="font-mono text-xs font-semibold text-ink transition-colors group-hover:text-phos">
            {title}
          </h3>

          <p className="mt-3 text-xs leading-[1.8] text-mute">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-line bg-black/30 p-4">
      <span className="shrink-0 font-mono text-[10px] text-phos/50">
        {number}
      </span>

      <div>
        <h3 className="font-mono text-xs font-semibold text-ink">{title}</h3>

        <p className="mt-2 text-xs leading-[1.8] text-mute">{description}</p>
      </div>
    </div>
  );
}

function Decision({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-l border-phos/20 pl-5">
      <h3 className="font-mono text-xs font-semibold text-ink">{title}</h3>

      <p className="mt-2 text-xs leading-[1.8] text-mute">{description}</p>
    </div>
  );
}

function TechRow({
  component,
  purpose,
}: {
  component: string;
  purpose: string;
}) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-phos/70">
        {component}
      </td>

      <td className="px-4 py-3 text-xs leading-relaxed text-mute">
        {purpose}
      </td>
    </tr>
  );
}

function WorkflowNode({ label }: { label: string }) {
  return (
    <div className="whitespace-nowrap rounded-md border border-line bg-bg/40 px-3 py-2 text-mute">
      {label}
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="mt-7 overflow-x-auto rounded-xl border border-line bg-black/50 p-6">
      <div className="min-w-[760px]">
        <div className="flex items-center justify-center gap-2 font-mono text-[10px]">
          <ArchitectureBox
            title="LINUX HOSTS"
            lines={["rsyslog", "auditd"]}
          />

          <Arrow />

          <ArchitectureBox
            title="INGESTION"
            lines={["TCP :5140", "Flask"]}
          />

          <Arrow />

          <ArchitectureBox
            title="PROCESSING"
            lines={["Parse", "Normalize"]}
          />

          <Arrow />

          <ArchitectureBox
            title="DETECTION"
            lines={["YAML rules", "MITRE ATT&CK"]}
          />
        </div>

        <div className="my-5 flex justify-center text-phos/30">↓</div>

        <div className="flex items-center justify-center gap-2 font-mono text-[10px]">
          <ArchitectureBox
            title="STORAGE"
            lines={["SQLite", "Events / Alerts"]}
          />

          <Arrow />

          <ArchitectureBox
            title="REAL-TIME"
            lines={["Socket.IO", "Event updates"]}
          />

          <Arrow />

          <ArchitectureBox
            title="FRONTEND"
            lines={["React", "Analyst dashboard"]}
          />
        </div>
      </div>
    </div>
  );
}

function ArchitectureBox({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="min-w-[145px] rounded-lg border border-line bg-bg/40 p-4">
      <p className="text-[9px] tracking-widest text-phos/50">{title}</p>

      <div className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <p key={line} className="text-mute">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function Arrow() {
  return <span className="shrink-0 text-phos/40">→</span>;
}

