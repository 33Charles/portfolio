const navigation = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line bg-black/25">
      <div className="absolute top-0 left-0 h-px w-10 bg-phos/70" />

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-2 py-10 lg:flex-row lg:justify-between lg:px-10">
        <a
          href="#home"
          className="font-mono text-lg font-bold tracking-tight text-ink transition-colors hover:text-phos"
        >
          D4SEIN<span className="text-phos">.</span>
        </a>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-mute transition-colors hover:text-phos"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <p className="font-mono text-xs text-mute">
          © {year} <span className="text-ink">D4SEIN</span>
        </p>
      </div>
    </footer>
  );
}