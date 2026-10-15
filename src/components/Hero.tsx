import SkillsGraph from "./SkillsGraph";
import CVModal from "./CVModal";
import { site } from "../site";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden px-5 py-32"
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-background.png')",
        }}
        aria-hidden="true"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-bg/96" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="font-mono text-sm text-phos">
            <span className="text-mute">$</span> whoami
          </p>
          <div>
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-8 bg-phos/40" />

              <p className="font-mono text-md font-black italic tracking-[0.12em] text-phos/50 uppercase">
                {site.handle}
              </p>

              <span className="h-px w-8 bg-phos/40" />
            </div>

            <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
              <span className="font-sans bg-linear-to-r from-phos/70 via-emerald-400/70 to-cyan-400/70 bg-clip-text text-transparent">
                {site.name}
              </span>
            </h1>

            <div className="mt-4 flex items-center gap-3 font-mono text-sm sm:text-base">
              <span className="text-phos">01</span>
              <span className="h-px w-3 bg-phos-dim" />
              <span className="text-mute">
                Security Researcher <span className="text-phos">·</span>{" "}
                Full-Stack Developer
              </span>
            </div>

            {/* Description */}
            <p className="mt-7 max-w-xl border-l border-phos/30 pl-4 font-mono text-xs font-light leading-[1.8] tracking-[0.01em] text-slate-300/80 sm:text-sm">
              Cybersecurity professional with hands-on experience in penetration
              testing across Active Directory, web applications, networks, and
              Windows and Linux environments. Experienced in security
              operations, SIEM, endpoint monitoring, threat detection, and
              threat hunting, with hands-on experience using Splunk, ELK, and
              Sysmon. Full-stack developer building security-focused tools and
              web applications.
            </p>

            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-mute/70">
              Based in {site.location}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
            <a
              href="#projects"
              className="rounded-md border border-phos-dim bg-phos/10 px-4 py-2 text-phos transition-colors hover:bg-phos hover:text-bg"
            >
              view projects
            </a>

            <a
              href={site.notesPath}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-line px-4 py-2 text-ink transition-colors hover:border-phos-dim hover:text-phos"
            >
              read write-ups
            </a>

            <a
              href="#contact"
              className="rounded-md border border-line px-4 py-2 text-ink transition-colors hover:border-phos-dim hover:text-phos"
            >
              get in touch
            </a>
            
          </div>

          <div className="mt-6 w-fit font-mono text-sm rounded-md border border-phos-dim bg-phos/10 px-4 py-2 text-phos transition-colors hover:bg-phos hover:text-bg ">
            <CVModal />
          </div>
        </div>

        <div>
          <SkillsGraph />
        </div>
      </div>
    </section>
  );
}
