
import { ArrowUpRight, Mail } from "lucide-react";
import { siGithub, siLinkerd, siTryhackme } from "simple-icons";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const credentials = [
  {
    label: "Certifications & Training",
    href: "#certifications",
  },
  {
    label: "TryHackMe Profile",
    href: "https://tryhackme.com/p/D4SEIN",
    external: true,
  },
  {
    label: "Hack The Box",
    href: "https://app.hackthebox.com/users/1691258",
    external: true,
  },
  {
    label: "Credly Badges",
    href: "https://www.credly.com/users/charles-mwangi.6792417a/badges/credly",
    external: true,
  },
];

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="group inline-flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-phos"
    >
      {children}
      {external && (
        <ArrowUpRight
          size={12}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className=" bg-black/25">
      <div className="mx-auto max-w-7xl py-12 px-2 lg:px-10">
        {/* Main columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr] lg:gap-12">
          {/* Identity */}
          <div >
            <a
              href="#home"
              className="inline-block font-mono text-2xl font-bold tracking-tight text-ink transition-colors hover:text-phos"
            >
              D4SEIN<span className="text-phos">.</span>
            </a>

            <p className="mt-4 text-sm leading-7 text-mute">
              Software Engineering graduate exploring cybersecurity,
              offensive security, security operations, and software
              development.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-ink">
              Navigate
            </h3>

            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.label}>
                  <FooterLink href={item.href}>
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Credentials */}
          <div>
            <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-ink">
              Credentials
            </h3>

            <ul className="space-y-3">
              {credentials.map((item) => (
                <li key={item.label}>
                  <FooterLink
                    href={item.href}
                    external={"external" in item && item.external}
                  >
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-ink">
              Connect
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://github.com/33Charles"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="text-mute transition-colors hover:text-phos"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                  aria-hidden="true"
                >
                  <path d={siGithub.path} />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/in/charles-mwangi-852b9b2a9/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="text-mute transition-colors hover:text-phos"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                  aria-hidden="true"
                >
                  <path d={siLinkerd.path} />
                </svg>
              </a>

              <a
                href="https://tryhackme.com/p/D4SEIN"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TryHackMe"
                title="TryHackMe"
                className="text-mute transition-colors hover:text-phos"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                  aria-hidden="true"
                >
                  <path d={siTryhackme.path} />
                </svg>
              </a>

              <a
                href="mailto:kamaucharles6884@gmail.com"
                aria-label="Email"
                title="Email"
                className="text-mute transition-colors hover:text-phos"
              >
                <Mail size={20} />
              </a>
            </div>

            <a
              href="#contact"
              className="mt-5 inline-block text-sm text-mute transition-colors hover:text-phos"
            >
              Get in touch →
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year}{" "}
            <span className="text-ink">D4SEIN</span> · All rights reserved.
          </p>

          <a
            href="#home"
            className="w-fit transition-colors hover:text-phos"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

