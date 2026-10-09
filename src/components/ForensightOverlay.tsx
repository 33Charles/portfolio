import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { FiArrowRight } from "react-icons/fi";

export function ForensightOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable =
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), ' +
            'select:not([disabled]), textarea:not([disabled]), ' +
            '[tabindex]:not([tabindex="-1"])'
        );

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  const technologies = [
    "Python",
    "Flask",
    "React",
    "SQLite",
    "rsyslog",
    "auditd",
    "Flask-SocketIO",
    "JWT",
    "MITRE ATT&CK",
  ];

  const results = [
    "Multi-host event collection",
    "Centralized log processing",
    "Rule-based threat detection",
    "Host auditing with auditd",
    "Network security event monitoring",
    "MITRE ATT&CK context",
    "Alert investigation workflow",
    "Role-based dashboard access",
    "CSV event export",
  ];

  const securityFeatures = [
    "JWT-based authentication",
    "Role-based access control",
    "Protected API endpoints",
    "Alert assignment",
    "Investigation status management",
    "Investigation notes and history",
  ];

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
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
      <div className="h-full overflow-y-auto overscroll-contain">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-line bg-black/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
              <span className="text-phos">FORENSIGHT</span>
              <span className="text-mute">/</span>
              <span className="text-mute">PROJECT 01</span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close Forensight project"
              className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mute transition-colors hover:text-phos focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phos"
            >
              <span>close</span>
              <span className="text-base leading-none text-phos/50 transition-colors group-hover:text-phos">
                ×
              </span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          {/* Hero */}
          <section>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-phos/50">
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
              Real-Time Log Analysis &amp; Threat Detection System
            </p>

            <p className="mt-7 max-w-3xl text-sm leading-[1.9] text-slate-300/80 sm:text-base">
              A lightweight, Linux-focused security monitoring system built
              to collect security-relevant events from multiple hosts,
              normalize incoming telemetry, evaluate configurable detection
              rules, and provide a centralized interface for security
              investigation.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {technologies.map((tech) => (
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
                rel="noopener noreferrer"
                className="rounded-md border border-phos-dim bg-phos/10 px-4 py-2.5 font-mono text-xs text-phos transition-colors hover:bg-phos hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phos"
              >
                view repository ↗
              </a>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-line px-4 py-2.5 font-mono text-xs text-mute transition-colors hover:border-phos/30 hover:text-phos focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phos"
              >
                back to projects
              </button>
            </div>
          </section>

          <section className="mt-12">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-phos/60">
                Product Preview
              </p>
              <span className="font-mono text-[10px] text-mute">
                APPLICATION DASHBOARD
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-black/60 p-2">
              <img
                src="dashboard.png"
                alt="Forensight security monitoring dashboard"
                className="block h-auto w-full rounded-lg"
                loading="lazy"
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-mute">
              Centralized visibility into security events and investigation
              activity across monitored Linux hosts.
            </p>
          </section>

          <div className="my-14 h-px bg-line" />

          {/* 01 Overview */}
          <CaseStudySection number="01" title="Overview">
            <p>
              FORENSIGHT was developed as a lightweight security monitoring
              platform for Linux environments. The system receives events
              from multiple hosts, processes and normalizes those events,
              evaluates them against detection logic, stores the resulting
              data, and presents security-relevant activity through a
              centralized React dashboard.
            </p>

            <p>
              The project brings together concepts from SIEM, security
              operations, threat detection, and incident investigation in an
              implementation small enough to understand and modify end to end.
            </p>
          </CaseStudySection>

          {/* 02 Problem */}
          <CaseStudySection number="02" title="Problem">
            <p>
              Security events generated by individual Linux systems can
              become difficult to investigate when they are distributed
              across multiple hosts and different log sources. Reviewing
              each system independently also makes it harder to identify
              recurring patterns or investigate related activity.
            </p>

            <p>
              The project therefore focused on building a centralized
              workflow capable of answering three practical questions:
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
                title="What happens next?"
                description="Give an analyst the context and tools needed to investigate an alert."
              />
            </div>
          </CaseStudySection>

          {/* 03 Architecture */}
          <CaseStudySection number="03" title="Architecture">
            <p>
              Linux hosts generate telemetry through logging, auditing, and
              relevant network security mechanisms. Applicable events are
              forwarded to a centralized receiver, processed by the backend,
              evaluated against detection rules, and stored. The React
              dashboard communicates with the backend through REST API
              endpoints and real-time Socket.IO updates.
            </p>

            <ArchitectureDiagram />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <TechnicalBlock
                title="Collection Layer"
                description="rsyslog forwards configured Linux log events to the centralized receiver. auditd supplies host-level auditing when the relevant audit rules are configured."
              />

              <TechnicalBlock
                title="Processing Layer"
                description="The backend receives incoming events, extracts relevant information, normalizes event fields, and passes data into the detection pipeline."
              />

              <TechnicalBlock
                title="Detection Layer"
                description="YAML-based rules define configurable detection conditions, separating detection definitions from much of the application logic."
              />

              <TechnicalBlock
                title="Presentation Layer"
                description="React provides the analyst interface. Flask exposes API endpoints, while Flask-SocketIO supports real-time updates to connected clients."
              />
            </div>
          </CaseStudySection>

          {/* 04 Event processing */}
          <CaseStudySection number="04" title="Event Processing">
            <p>
              A typical event passes through several stages before becoming
              available for alert review or investigation. The precise path
              depends on the event source and the configured ingestion method.
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
                description="rsyslog forwards applicable events to the centralized TCP receiver."
              />

              <PipelineStep
                number="03"
                title="Parsing & Normalization"
                description="The backend extracts relevant fields and converts incoming data into a consistent internal representation."
              />

              <PipelineStep
                number="04"
                title="Detection"
                description="The normalized event is evaluated against the applicable configured detection rules."
              />

              <PipelineStep
                number="05"
                title="Persistence"
                description="Events, alerts, and associated application metadata are stored in SQLite."
              />

              <PipelineStep
                number="06"
                title="Real-Time Delivery"
                description="The backend emits supported updates through Flask-SocketIO to connected dashboard clients."
              />

              <PipelineStep
                number="07"
                title="Investigation"
                description="An analyst reviews event details, updates the investigation status, records findings, and resolves or reopens the item where supported."
              />
            </div>
          </CaseStudySection>

          {/* 05 Detection engineering */}
          <CaseStudySection number="05" title="Detection Engineering">
            <p>
              Detection logic focuses on security-relevant behaviors rather
              than simply displaying raw log entries. Configured rules
              evaluate available telemetry and surface matching activity
              for analyst review. An alert is an investigative signal, not
              automatic proof that an attack succeeded.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetectionCard
                title="Brute-Force Activity"
                description="Surfaces repeated failed authentication attempts that meet the configured detection criteria."
              />

              <DetectionCard
                title="Port Scanning"
                description="Uses available firewall or audit telemetry to surface patterns associated with network reconnaissance."
              />

              <DetectionCard
                title="Reverse-Shell Indicators"
                description="Flags configured indicators of suspicious shell activity or outbound connections for analyst investigation."
              />

              <DetectionCard
                title="Privilege Escalation"
                description="Surfaces configured indicators of suspicious privilege-related activity without assuming that escalation succeeded."
              />

              <DetectionCard
                title="Sensitive File Access"
                description="Uses configured audit rules to surface access to sensitive paths such as /etc/passwd, /etc/shadow, and /etc/sudoers."
              />

              <DetectionCard
                title="Suspicious System Activity"
                description="Applies additional configured rules to selected system events and suspicious behavior patterns."
              />
            </div>

            <p className="mt-4 text-xs leading-relaxed text-mute">
              Detection coverage depends on the rules enabled, the telemetry
              collected, and the configuration of the monitored hosts.
            </p>
          </CaseStudySection>

          {/* 06 MITRE ATT&CK */}
          <CaseStudySection number="06" title="MITRE ATT&CK Mapping">
            <p>
              Mapping applicable detections to MITRE ATT&CK gives analysts
              a common vocabulary for describing the adversary behavior
              associated with an alert. Mappings should reflect the
              behavior represented by each implemented detection rule.
            </p>

            <div className="mt-6 rounded-lg border border-line bg-black/40 p-5 font-mono text-xs">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <span className="text-phos/40">TACTIC</span>
                  <p className="mt-2 text-ink/80">Credential Access</p>
                </div>

                <div>
                  <span className="text-phos/40">TECHNIQUE</span>
                  <p className="mt-2 text-ink/80">Brute Force</p>
                </div>

                <div>
                  <span className="text-phos/40">TECHNIQUE ID</span>
                  <p className="mt-2 text-ink/80">T1110</p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-mute">
              Example mapping for a brute-force detection. The mappings
              presented by the application should match the techniques
              associated with the current implementation.
            </p>
          </CaseStudySection>

          {/* 07 Investigation workflow */}
          <CaseStudySection number="07" title="Investigation Workflow">
            <p>
              Detection is only useful when an analyst can act on the
              resulting alert. FORENSIGHT provides an investigation workflow
              for reviewing security events, recording findings, managing
              status, and tracking investigation activity.
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
                description="Administrative, analyst, and viewer roles have different permissions for viewing events and performing supported actions."
              />

              <TechnicalBlock
                title="Assignment"
                description="Alerts can be assigned to support clear responsibility during investigation."
              />

              <TechnicalBlock
                title="Investigation Notes"
                description="Analysts can record findings and supporting context while reviewing an alert."
              />

              <TechnicalBlock
                title="Status Management"
                description="Events can move through supported investigation states, including resolution and reopening where implemented."
              />
            </div>
          </CaseStudySection>

          {/* 08 Technical implementation */}
          <CaseStudySection number="08" title="Technical Implementation">
            <p>
              The system combines a Python backend, relational persistence,
              configurable detection rules, Linux logging and auditing
              mechanisms, and a React-based analyst interface.
            </p>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-black/40">
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-phos/50"
                    >
                      Component
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-phos/50"
                    >
                      Purpose
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <TechRow
                    component="Python"
                    purpose="Backend logic, event processing, detection, and automation."
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
                    purpose="JWT authentication and token-related authorization support."
                  />

                  <TechRow
                    component="Flask-SocketIO"
                    purpose="Real-time event and application update delivery to connected clients."
                  />

                  <TechRow
                    component="SQLite"
                    purpose="Relational storage for events, alerts, investigations, and associated metadata."
                  />

                  <TechRow
                    component="React"
                    purpose="Interactive analyst dashboard and application interface."
                  />

                  <TechRow
                    component="rsyslog"
                    purpose="Centralized forwarding of configured Linux log events."
                  />

                  <TechRow
                    component="auditd"
                    purpose="Host-level auditing when appropriate audit rules are configured."
                  />

                  <TechRow
                    component="iptables"
                    purpose="Firewall rules and logging used to generate relevant network security events."
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
                description="It provides a straightforward way to forward Linux logs from multiple hosts without requiring a heavyweight collection agent."
              />

              <Decision
                title="Why auditd?"
                description="Standard system logs do not expose every security-relevant signal. Configured audit rules can add visibility into selected system activity and access to sensitive files."
              />

              <Decision
                title="Why YAML detection rules?"
                description="Separating detection definitions from application logic makes rules easier to inspect and modify as the detection set evolves."
              />

              <Decision
                title="Why WebSockets?"
                description="Security monitoring benefits from timely visibility. Flask-SocketIO allows supported updates to reach connected dashboard clients without relying exclusively on manual refreshes."
              />

              <Decision
                title="Why SQLite?"
                description="For a lightweight research and learning platform, SQLite simplifies deployment while providing relational storage for events, alerts, and investigations."
              />
            </div>
          </CaseStudySection>

          {/* 10 Security */}
          <CaseStudySection number="10" title="Security & Access Control">
            <p>
              Because a monitoring application handles security-related
              information, authentication and access control are important
              parts of its design. The implementation uses JWT-based
              authentication and role-based permissions for supported
              application operations.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {securityFeatures.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-line bg-black/30 px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="text-phos/60"
                  >
                    ✓
                  </span>
                  <span className="text-xs text-mute">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-mute">
              This is a learning and research project. Authentication,
              permissions, deployment security, and auditability should be
              reviewed before using the system in a production environment.
            </p>
          </CaseStudySection>

          {/* 11 Limitations */}
          <CaseStudySection number="11" title="Limitations">
            <p>
              FORENSIGHT is a learning and research project rather than a
              production SIEM. Its detection capabilities focus on a
              defined set of Linux security events and configurable
              rule-based behaviors.
            </p>

            <p>
              Detection quality depends on the available telemetry, active
              logging and audit configuration, rule coverage, and the
              quality of the incoming data. Rule-based indicators can
              generate false positives and may miss activity that does
              not match the implemented logic.
            </p>

            <p>
              SQLite and the current application architecture are intended
              to keep the project understandable and lightweight, not to
              reproduce the scale or distributed processing capabilities
              of enterprise SIEM platforms.
            </p>
          </CaseStudySection>

          {/* 12 What I learned */}
          <CaseStudySection number="12" title="What I Learned">
            <p>
              Building FORENSIGHT provided practical experience with the
              challenges behind security monitoring systems: collecting
              heterogeneous telemetry, normalizing events, designing
              detection logic, handling real-time updates, and presenting
              enough context for an analyst to investigate an alert.
            </p>

            <p>
              The project also reinforced the relationship between
              offensive and defensive security. Understanding how
              reconnaissance, credential attacks, privilege-related
              activity, and suspicious network behavior appear in system
              and network telemetry helped shape the detection concepts
              explored in the platform.
            </p>
          </CaseStudySection>

          {/* Repository CTA */}
          <section className="mt-16 border-t border-line pt-10">
            <div className="rounded-xl border border-phos/20 bg-phos/5 p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-phos/50">
                Repository
              </p>

              <h2 className="mt-3 text-xl font-semibold text-ink">
                Explore the implementation
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-[1.8] text-mute">
                Explore the source code, setup instructions, implementation
                details, detection rules, and project documentation on GitHub.
              </p>

              <a
                href="https://github.com/33Charles/forensight"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-md border border-phos-dim bg-phos/10 px-4 py-2.5 font-mono text-xs text-phos transition-colors hover:bg-phos hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phos"
              >
                open GitHub repository ↗
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


function CaseStudySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-16 first:mt-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-phos/50">
          {number}
        </span>

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
    <div className="rounded-lg border border-line bg-black/30 p-5 transition-colors hover:border-phos/20">
      <h3 className="font-mono text-xs font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-3 text-xs leading-[1.8] text-mute">
        {description}
      </p>
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
    <div className="rounded-lg border border-line bg-black/30 p-5 transition-colors hover:border-phos/20">
      <span className="font-mono text-[10px] text-phos/40">
        {number}
      </span>

      <h3 className="mt-3 font-mono text-xs font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-[1.8] text-mute">
        {description}
      </p>
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
    <div className="group h-full rounded-lg border border-line bg-black/30 p-5 transition-colors hover:border-phos/25">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-phos/60"
        />

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
    <div className="flex gap-4 rounded-lg border border-line bg-black/30 p-4 transition-colors hover:border-phos/20">
      <span className="shrink-0 font-mono text-[10px] text-phos/50">
        {number}
      </span>

      <div>
        <h3 className="font-mono text-xs font-semibold text-ink">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-[1.8] text-mute">
          {description}
        </p>
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
      <h3 className="font-mono text-xs font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-[1.8] text-mute">
        {description}
      </p>
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
    <div className="mt-7 overflow-x-auto rounded-xl border border-line bg-black/50 p-5 sm:p-6">
      <div className="min-w-[760px] space-y-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-phos/50">
          01 / Collection and detection
        </p>

        <div className="flex items-center justify-center gap-2 font-mono text-[10px]">
          <ArchitectureBox
            title="LINUX HOSTS"
            lines={["System logs", "auditd / firewall"]}
          />

          <Arrow />

          <ArchitectureBox
            title="INGESTION"
            lines={["rsyslog TCP", "Receiver :5140"]}
          />

          <Arrow />

          <ArchitectureBox
            title="PROCESSING"
            lines={["Parse", "Normalize"]}
          />

          <Arrow />

          <ArchitectureBox
            title="DETECTION"
            lines={["YAML rules", "Generate alerts"]}
          />
        </div>

        <div className="border-t border-dashed border-phos/20 pt-5">
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-phos/50">
            02 / Backend responsibilities
          </p>

          <div className="grid grid-cols-3 gap-3">
            <ArchitectureBox
              title="PERSISTENCE"
              lines={["SQLite", "Events / alerts"]}
            />

            <ArchitectureBox
              title="REST API"
              lines={["Flask", "Queries / updates"]}
            />

            <ArchitectureBox
              title="LIVE DELIVERY"
              lines={["Flask-SocketIO", "Live updates"]}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-sm rounded-lg border border-phos/30 bg-phos/5 p-4 text-center">
            <p className="font-mono text-[9px] uppercase tracking-widest text-phos/60">
              Analyst interface
            </p>

            <p className="mt-2 text-sm font-semibold text-ink">
              React Dashboard
            </p>

            <p className="mt-1 text-xs text-mute">
              REST API + real-time updates
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] leading-relaxed text-mute">
          The backend persists application data and provides separate API
          and real-time communication paths to connected clients.
        </p>
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
      <p className="text-[9px] tracking-widest text-phos/50">
        {title}
      </p>

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
  return (
    <FiArrowRight
      className="shrink-0 text-phos/40"
      size={20}
      aria-hidden="true"
    />
  );
}