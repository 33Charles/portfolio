import { SectionLabel } from './About'

const GROUPS = [
  {
    title: 'Active Directory',
    items: [
      'Kerberoasting & delegation abuse',
      'ADCS (ESC1 and related templates)',
      'DCSync & credential theft',
      'BloodHound-driven attack paths',
      'GPO & shadow credential abuse',
    ],
  },
  {
    title: 'Web application',
    items: ['SQL injection', 'XSLT / XXE injection', 'Local & path traversal', 'Auth and session flaws'],
  },
  {
    title: 'Tooling',
    items: ['nmap, BloodHound, certipy', 'evil-winrm, chisel, ligolo', 'Burp Suite', 'Linux & Windows CLI'],
  },
  {
    title: 'Frontend',
    items: ['React & TypeScript', 'Tailwind CSS', 'Vite tooling', 'Recharts data visualization'],
  },
]

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-5xl px-5 py-20">
      <SectionLabel index="02" title="skills" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {GROUPS.map((group) => (
          <div key={group.title} className="rounded-lg border border-line p-5">
            <h3 className="font-mono text-sm text-phos">{group.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-mute">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-phos-dim">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 font-mono text-xs text-mute">
        Detailed write-ups with full methodology live in{' '}
        <a href="/labs-and-notes/" target="_blank" rel="noreferrer" className="text-phos hover:underline">
          labs &amp; notes
        </a>
        .
      </p>
    </section>
  )
}
