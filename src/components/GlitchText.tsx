import { useEffect, useRef, useState } from 'react'

interface GlitchTextProps {
  text: string
  className?: string
  /** Roughly how often a glitch burst fires, in ms. A little randomness is added so it doesn't feel metronomic. */
  intervalMs?: number
  /** How long a single burst lasts, in ms. Keep this under ~700ms so it reads as a blip, not an effect. */
  durationMs?: number
}

export default function GlitchText({
  text,
  className,
  intervalMs = 1000,
  durationMs = 480,
}: GlitchTextProps) {
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return // text stays static, no bursts, no timers

    let cancelled = false

    const scheduleNext = () => {
      // Jitter the gap (±35%) so bursts don't land on a perfectly predictable beat.
      const jitter = intervalMs * 0.35
      const wait = intervalMs + (Math.random() * 2 - 1) * jitter
      timeoutRef.current = window.setTimeout(() => {
        if (cancelled) return
        setActive(true)
        window.setTimeout(() => {
          if (cancelled) return
          setActive(false)
          scheduleNext()
        }, durationMs)
      }, wait)
    }

    scheduleNext()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutRef.current)
    }
  }, [intervalMs, durationMs])

  return (
    <span
      data-text={text}
      className={`glitch ${active ? 'glitch-active' : ''} ${className ?? ''}`}
    >
      {text}
    </span>
  )
}
