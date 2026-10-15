import { useState } from "react";
import {
  siGithub,
  siCredly,
  siTryhackme,
  siHackthebox,
} from "simple-icons/icons";

type Credential = {
  title: string;
  issuer: string;
  type: "Certification" | "Training" | "Badge";
  description: string;
  link: string;
  accent: string;
};

const credentials: Credential[] = [
  {
    title: "Ethical Hacker",
    issuer: "Cisco Networking Academy",
    type: "Certification",
    description:
      "Training in ethical hacking, vulnerability assessment, penetration testing, and security reporting, supported by hands-on labs.",
    link: "https://www.credly.com/badges/2ce278ef-7474-4eda-bbba-7afca58916a2",
    accent: "#5bd68a",
  },
  {
    title: "Network Support and Security",
    issuer: "Cisco Networking Academy",
    type: "Certification",
    description:
      "Training in network and endpoint troubleshooting, technical documentation, and remote user support.",
    link: "https://www.credly.com/badges/5b92749a-f164-4a0a-acbd-d3218b2c8fb5",
    accent: "#e6b450",
  },

  {
    title: "Networking Devices and Initial Configuration",
    issuer: "Cisco Networking Academy",
    type: "Certification",
    description:
      "Training in Cisco device configuration, IPv4 addressing and subnetting, network connectivity troubleshooting, and basic cloud and virtualization concepts.",
    link: "https://www.credly.com/badges/cda9ebb9-705a-4e35-880b-0b2f2491d71b",
    accent: "#5ec8e6",
  },

  {
    title: "SOC Level 1",
    issuer: "TryHackMe",
    type: "Certification",
    description:
      "Hands-on training in security operations, network and web attack analysis, endpoint threat monitoring, and SIEM-based incident investigation.",
    link: "https://tryhackme.com/p/D4SEIN?tab=certificates",
    accent: "#e05cff",
  },

  {
    title: "Introduction to Active Directory",
    issuer: "Hack The Box Academy",
    type: "Badge",
    description:
      "Foundational training in Active Directory structures, authentication protocols, enterprise objects, and Windows permissions and privileges.",
    link: "https://academy.hackthebox.com/achievement/badge/7e98a537-821b-11ef-864f-bea50ffe6cb4",
    accent: "#5bd68a",
  },

  {
    title: "Intro to Network Traffic Analysis",
    issuer: "Hack The Box Academy",
    type: "Badge",
    description:
      "Practical training in network traffic analysis using Wireshark and tcpdump to inspect network communications and identify exposed sensitive data.",
    link: "https://academy.hackthebox.com/achievement/badge/4792091c-ea3b-11f0-9254-bea50ffe6cb4",
    accent: "#5ec8e6",
  },

  {
    title: "Windows Event Logs & Finding Evil",
    issuer: "Hack The Box Academy",
    type: "Badge",
    description:
      "Hands-on training in Windows event log analysis, Sysmon, ETW, and threat hunting to identify DLL hijacking, code injection, credential dumping, and other malicious activity.",
    link: "https://academy.hackthebox.com/achievement/badge/1061f34e-ea3f-11f0-9254-bea50ffe6cb4",
    accent: "#e05cff",
  },

  {
    title: "Web Fuzzing",
    issuer: "Hack The Box Academy",
    type: "Badge",
    description:
      "Practical training in directory and file discovery, parameter and value fuzzing, result analysis, and identifying potential web application vulnerabilities.",
    link: "https://academy.hackthebox.com/achievement/badge/31240677-a8db-11ef-864f-bea50ffe6cb4",
    accent: "#e6b450",
  },

  {
    title: "Attacking Enterprise Networks",
    issuer: "Hack The Box Academy",
    type: "Badge",
    description:
      "Hands-on penetration testing training covering external reconnaissance, vulnerability assessment, exploitation, Active Directory attacks, lateral movement, and engagement reporting.",
    link: "https://academy.hackthebox.com/achievement/badge/b527c167-f871-11f0-9254-bea50ffe6cb4",
    accent: "#ff6b78",
  },
  {
    title: "Full-Stack Software Development",
    issuer: "Teach2Give",
    type: "Training",
    description:
      "Completed a 12-week full-stack development bootcamp covering JavaScript, TypeScript, React, Material UI, Node.js, Prisma, and modern web application development.",
    link: "https://drive.google.com/file/d/1XMsuQuBDuY_6wnWCoqXDc-eEreRR0Mor/view",
    accent: "#5ec8e6",
  },
];

const filters = ["All", "Certification", "Training", "Badge"] as const;

const profiles = [
  {
    name: "GitHub",
    detail: "Projects, source code, and tools",
    href: "https://github.com/33Charles",
    accent: "#F0F6FC",
    icon: siGithub,
  },
  {
    name: "Credly",
    detail: "Verified credentials",
    href: "https://www.credly.com/users/charles-mwangi.6792417a/badges/credly",
    accent: "#FF6B35",
    icon: siCredly,
  },
  {
    name: "TryHackMe",
    detail: "Certificates and learning profile",
    href: "https://tryhackme.com/p/D4SEIN?tab=certificates",
    accent: "#C11111",
    icon: siTryhackme,
  },
  {
    name: "Hack The Box",
    detail: "Practical security achievements",
    href: "https://profile.hackthebox.com/profile/01a0843d-db7e-70ed-a048-5c9c58597386",
    accent: "#9FEF00",
    icon: siHackthebox,
  },
];

function ExternalArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M7 17 17 7M8 7h9v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CredentialIcon({ type }: { type: Credential["type"] }) {
  const paths = {
    Certification: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path d="m9 13-1 7 4-2 4 2-1-7" />
      </>
    ),
    Training: (
      <>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22z" />
        <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v17h6.5a2.5 2.5 0 0 1 2.5 2z" />
      </>
    ),
    Badge: (
      <>
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[type]}
    </svg>
  );
}

export default function Certifications() {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");

  const filteredCredentials = credentials.filter(
    (credential) => activeFilter === "All" || credential.type === activeFilter,
  );

  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="relative overflow-hidden bg-black/25 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "#5bd68a" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full opacity-[0.05] blur-3xl"
        style={{ background: "#b892ff" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-phos" />
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-phos">
              Continuous learning
            </span>
          </div>

          <h2
            id="certifications-heading"
            className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            Certifications <span className="text-phos">&amp; Training</span>
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-7 text-mute sm:text-base">
            Professional credentials, focused security training, and hands-on
            achievements gained through continuous learning and practical
            technical exploration.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              value: "04",
              label: "Credential links",
              color: "#5bd68a",
            },
            {
              value: "01",
              label: "Training certificate",
              color: "#e05cff",
            },
            {
              value: "05",
              label: "Academy badges",
              color: "#5ec8e6",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-line bg-white/[0.02] p-4 sm:p-5"
            >
              <p
                className="font-mono text-2xl font-semibold sm:text-3xl"
                style={{ color: item.color }}
              >
                {item.value}
              </p>
              <p className="mt-2 text-[10px] leading-4 text-mute sm:text-xs">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const selected = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-xs transition-colors duration-200 ${
                  selected
                    ? "border-phos/40 bg-phos/10 text-phos"
                    : "border-line bg-white/[0.02] text-mute hover:border-white/20 hover:text-ink"
                }`}
              >
                {filter === "All" ? "All credentials" : `${filter}s`}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCredentials.map((credential) => (
            <article
              key={credential.link}
              className="group relative flex min-h-56 flex-col overflow-hidden rounded-xl border border-line bg-white/[0.025] p-5 transition-colors duration-300 hover:bg-white/[0.045]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px opacity-50"
                style={{
                  background: `linear-gradient(90deg, transparent, ${credential.accent}, transparent)`,
                }}
              />

              <div className="mb-5 flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    color: credential.accent,
                    borderColor: `${credential.accent}30`,
                    backgroundColor: `${credential.accent}0c`,
                  }}
                >
                  <CredentialIcon type={credential.type} />
                </div>

                <span
                  className="rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider"
                  style={{
                    color: credential.accent,
                    borderColor: `${credential.accent}35`,
                    backgroundColor: `${credential.accent}0b`,
                  }}
                >
                  {credential.type}
                </span>
              </div>

              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                {credential.issuer}
              </p>

              <h3 className="text-base font-medium leading-6 text-ink">
                {credential.title}
              </h3>

              <p className="mt-3 flex-1 text-xs leading-6 text-mute">
                {credential.description}
              </p>

              <a
                href={credential.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-fit items-center gap-2 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: credential.accent }}
              >
                Verify credential
                <ExternalArrow />
              </a>

              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-5 h-px w-0 transition-all duration-300 group-hover:w-10"
                style={{ backgroundColor: credential.accent }}
              />
            </article>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <div className="mb-5">
            <h3 className="text-lg font-medium text-ink">
              Explore my learning profiles
            </h3>
            <p className="mt-2 text-sm leading-6 text-mute">
              Browse my public credentials, certificates, and additional
              practical learning achievements.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {profiles.map((profile) => (
              <a
                key={profile.name}
                href={profile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-line bg-white/[0.02] p-4 transition-colors duration-200"
                style={{ ["--accent" as string]: profile.accent }}
              >

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ backgroundColor: `${profile.accent}1A` }} 
                />

                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
                  style={{ backgroundColor: profile.accent }}
                />

                <div
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    color: profile.accent,
                    backgroundColor: `${profile.accent}12`,
                    borderColor: `${profile.accent}30`,
                  }}
                >
                  <svg
                    role="img"
                    aria-label={`${profile.name} logo`}
                    viewBox={`0 0 24 24`}
                    className="h-6 w-6"
                    fill="currentColor"
                  >
                    <path d={profile.icon.path} />
                  </svg>
                </div>

                <div className="relative min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium leading-tight"
                    style={{ color: profile.accent }}
                  >
                    {profile.name}
                  </p>
                  <p className="mt-1 truncate text-xs leading-tight text-mute">
                    {profile.detail}
                  </p>
                </div>

                <span
                  className="relative shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: profile.accent }}
                >
                  <ExternalArrow />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
