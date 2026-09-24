import SkillsGraph from "./SkillsGraph";
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
      <div
        className="absolute inset-0 bg-bg/96"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="font-mono text-sm text-phos">
            <span className="text-mute">$</span> whoami
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {site.name}
          </h1>

          <p className="mt-2 font-mono text-lg text-mute">
            security researcher &amp; frontend developer
          </p>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-mute sm:text-lg">
            I break Active Directory environments and web applications to
            understand how they fail, then build clean, production-grade
            interfaces with React, TypeScript and Tailwind CSS. Based in{" "}
            {site.location}.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
            <a
              href="#projects"
              className="rounded border border-phos-dim bg-phos/10 px-4 py-2 text-phos transition-colors hover:bg-phos hover:text-bg"
            >
              view work
            </a>

            <a
              href={site.notesPath}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-line px-4 py-2 text-ink transition-colors hover:border-phos-dim hover:text-phos"
            >
              read write-ups
            </a>

            <a
              href="#contact"
              className="rounded border border-line px-4 py-2 text-ink transition-colors hover:border-phos-dim hover:text-phos"
            >
              get in touch
            </a>
          </div>

          <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-line/10 px-5 py-2 font-mono text-xs text-mute">
            <span className="status-dot" aria-hidden="true" />
              Available for opportunities
          </div>
        </div>

        <SkillsGraph />
      </div>
    </section>
  );
}