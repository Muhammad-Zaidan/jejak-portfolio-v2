'use client'
import { useEffect, useRef, type CSSProperties } from 'react'
import { splitMarks } from '@/lib/marks'

/**
 * A statement that lights up word by word while it scrolls through the screen. Fully lit without JS.
 * Words wrapped in *asterisks* get the second voice: serif italic in the accent colour.
 */
export function Scrub({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const update = () => {
      const r = el.getBoundingClientRect()
      const p = (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.3)
      el.style.setProperty('--p', String(Math.min(1, Math.max(0, p))))
    }
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])

  const words = splitMarks(text)

  return (
    <p ref={ref} className={`scrub ${className ?? ''}`} style={{ '--n': words.length } as CSSProperties}>
      {words.map(({ word, accent }, i) => (
        <span key={i} className={accent ? 'scrub-accent' : undefined} style={{ '--i': i } as CSSProperties}>
          {word}{' '}
        </span>
      ))}
    </p>
  )
}
