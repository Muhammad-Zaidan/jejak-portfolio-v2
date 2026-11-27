'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Social = readonly [label: string, href: string]
type Text = { talk: string; talkLine: string; talkForm: string; local: string; replies: string; copy: string; copied: string; chat: string }

/** "user" out of linkedin.com/in/user, "@user" for Instagram, the number for WhatsApp. */
const handle = (label: string, href: string) => {
  const path = href.replace(/\/+$/, '').split('/').pop() ?? ''
  if (label === 'WhatsApp') return `+${path.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '$1 $2-$3-$4')}`
  if (label === 'Instagram') return `@${path}`
  return path
}

/**
 * The closing section: a big invitation, the local time and how quickly a reply comes, the two fastest ways to reach
 * out (WhatsApp, copy the email), then every profile as a full-width row that fills orange under the pointer.
 */
export function Talk({ email, socials, formHref, t }: { email: string; socials: Social[]; formHref: string; t: Text }) {
  const [time, setTime] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 20000)
    return () => clearInterval(id)
  }, [])
  const wa = socials.find(([l]) => l === 'WhatsApp')?.[1]
  // the round button leans toward the pointer, then springs back
  const magnet = useRef<HTMLAnchorElement>(null)
  const pull = (e: React.PointerEvent) => {
    const el = magnet.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.25}px`
  }
  const release = () => magnet.current && (magnet.current.style.translate = '0 0')

  return (
    <div className="talk-wrap">
      <p className="talk-line">{t.talkLine}</p>
      <a href={`mailto:${email}`} className="talk-big display-font" aria-label={`${t.talk}: ${email}`}>
        {[...t.talk].map((ch, i) => <span key={i} style={{ transitionDelay: `${i * 18}ms` }}>{ch === ' ' ? ' ' : ch}</span>)}
      </a>
      <p className="talk-meta">
        <span className="live-led" aria-hidden />
        {t.local} {time || '--.--'} WIB · {t.replies}
      </p>
      <div className="talk-actions">
        {wa && (
          <a ref={magnet} href={wa} target="_blank" rel="noopener noreferrer" className="talk-orb" onPointerMove={pull} onPointerLeave={release}>
            <span className="talk-orb-text">{t.chat}</span>
            <span className="talk-orb-arrow" aria-hidden>↗</span>
          </a>
        )}
        <div className="talk-links">
          <button
            type="button"
            className="talk-link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(email)
                setCopied(true)
                setTimeout(() => setCopied(false), 1800)
              } catch {
                location.href = `mailto:${email}`
              }
            }}
          >
            <span className="talk-link-label">{copied ? t.copied : t.copy}</span>
            <span className="talk-link-value">{email}</span>
          </button>
          <Link href={formHref} className="talk-link">
            <span className="talk-link-label">{t.talkForm}</span>
            <span className="talk-link-value">→</span>
          </Link>
        </div>
      </div>
      <ul className="talk-socials">
        {socials.map(([label, href]) => (
          <li key={label}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <span className="talk-social-name display-font">{label}</span>
              <span className="talk-social-handle">{handle(label, href)}</span>
              <span className="talk-social-arrow" aria-hidden>↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
