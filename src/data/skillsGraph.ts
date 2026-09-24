export type SkillCategory = 'ad' | 'web' | 'tooling' | 'fullstack' | 'lang' | 'soc'

export interface SkillNode {
  id: string
  label: string
  category: SkillCategory
}

export interface SkillEdge {
  from: string
  to: string
}

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  ad: 'Active Directory',
  web: 'Web Pentesting',
  tooling: 'Tooling',
  fullstack: 'Fullstack',
  lang: 'Languages & Scripting',
  soc: 'SOC / Blue Team',
}


export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  ad: '#5bd68a',
  web: '#e6b450', 
  tooling: '#ff6b78', 
  fullstack: '#5ec8e6',
  lang: '#F7FD04', 
  soc: '#e05cff', 
}

export const SKILL_NODES: SkillNode[] = [
  // Active Directory
  { id: 'kerberoast', label: 'Kerberoasting', category: 'ad' },
  { id: 'esc1', label: 'ADCS (ESC1)', category: 'ad' },
  { id: 'dcsync', label: 'DCSync', category: 'ad' },
  { id: 'bloodhound', label: 'BloodHound', category: 'ad' },
  { id: 'gpo-abuse', label: 'GPO Abuse', category: 'ad' },
  { id: 'constrained-delegation', label: 'Constrained Delegation', category: 'ad' },

  // Web Pentesting
  { id: 'sqli', label: 'SQL Injection', category: 'web' },
  { id: 'xxe', label: 'XXE Injection', category: 'web' },
  { id: 'ssti', label: 'SSTI', category: 'web' },
  { id: 'traversal', label: 'Path Traversal', category: 'web' },
  { id: 'xss', label: 'XSS', category: 'web' },

  // Tooling
  { id: 'burp', label: 'Burp Suite', category: 'tooling' },
  { id: 'nmap', label: 'nmap', category: 'tooling' },
  { id: 'evil-winrm', label: 'evil-winrm', category: 'tooling' },
  { id: 'logolo', label: 'logolo', category: 'tooling' },
  { id: 'ghidra', label: 'Ghidra', category: 'tooling' },
  { id: 'x64dbg', label: 'x64dbg', category: 'tooling' },

  // Fullstack
  { id: 'react', label: 'React', category: 'fullstack' },
  { id: 'typescript', label: 'TypeScript', category: 'fullstack' },
  { id: 'nodejs', label: 'Node.js', category: 'fullstack' },
  { id: 'postgres', label: 'PostgreSQL', category: 'fullstack' },
  { id: 'django', label: 'Django', category: 'fullstack' },
  { id: 'flask', label: 'Flask', category: 'fullstack' },
  { id: 'tailwind', label: 'Tailwind CSS', category: 'fullstack' },
  { id: 'prisma', label: 'Prisma', category: 'fullstack' },
  { id: 'recharts', label: 'Recharts', category: 'fullstack' },

  // Languages & Scripting
  { id: 'python', label: 'Python', category: 'lang' },
  { id: 'bash', label: 'Bash', category: 'lang' },
  { id: 'cpp', label: 'C++', category: 'lang' },

  // SOC / Blue Team
  { id: 'splunk', label: 'Splunk', category: 'soc' },
  { id: 'elk', label: 'ELK Stack', category: 'soc' },
  { id: 'wireshark', label: 'Wireshark', category: 'soc' },
  { id: 'sysmon', label: 'Sysmon', category: 'soc' },
  { id: 'mitre-attack', label: 'MITRE ATT&CK', category: 'soc' },
  { id: 'yara', label: 'YARA', category: 'soc' },
]

export const SKILL_EDGES: SkillEdge[] = [
  // Active Directory — attack chain
  { from: 'bloodhound', to: 'kerberoast' },
  { from: 'bloodhound', to: 'gpo-abuse' },
  { from: 'kerberoast', to: 'dcsync' },
  { from: 'esc1', to: 'dcsync' },
  { from: 'esc1', to: 'bloodhound' },
  { from: 'constrained-delegation', to: 'bloodhound' },
  { from: 'constrained-delegation', to: 'dcsync' },

  // Web Application
  { from: 'ssti', to: 'traversal' },
  { from: 'sqli', to: 'xxe' },
  { from: 'xss', to: 'sqli' },

  // Tooling
  { from: 'chisel', to: 'evil-winrm' },
  { from: 'nmap', to: 'burp' },
  { from: 'ghidra', to: 'x64dbg' },

  // Cross-category — tools used against techniques
  { from: 'burp', to: 'sqli' },
  { from: 'burp', to: 'xxe' },
  { from: 'burp', to: 'xss' },
  { from: 'evil-winrm', to: 'kerberoast' },
  { from: 'nmap', to: 'bloodhound' },
  { from: 'python', to: 'bloodhound' },
  { from: 'python', to: 'burp' },
  { from: 'ghidra', to: 'python' },

  // Cross-category — languages powering the stack / tooling
  { from: 'python', to: 'nmap' },
  { from: 'python', to: 'bash' },
  { from: 'bash', to: 'cpp' },
  { from: 'typescript', to: 'react' },
  { from: 'react', to: 'nodejs' },
  { from: 'nodejs', to: 'postgres' },
  { from: 'nodejs', to: 'prisma' },
  { from: 'prisma', to: 'postgres' },
  { from: 'react', to: 'tailwind' },
  { from: 'react', to: 'recharts' },
  { from: 'typescript', to: 'django' },
  { from: 'django', to: 'flask' },
  { from: 'flask', to: 'python' },
  { from: 'django', to: 'python' },

  // Cross-category — SOC / Blue Team
  { from: 'splunk', to: 'elk' },
  { from: 'splunk', to: 'mitre-attack' },
  { from: 'elk', to: 'sysmon' },
  { from: 'sysmon', to: 'mitre-attack' },
  { from: 'wireshark', to: 'nmap' },
  { from: 'yara', to: 'ghidra' },
  { from: 'yara', to: 'mitre-attack' },
  { from: 'mitre-attack', to: 'bloodhound' },
  { from: 'sysmon', to: 'gpo-abuse' },
]