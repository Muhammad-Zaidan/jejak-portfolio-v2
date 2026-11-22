'use client'
import { useEffect, useState } from 'react'
import { Logo } from './logo'

/**
 * Intro screen: the logo appears, the name under it, then the screen lifts away.
 * Timing is pure CSS, so it leaves even if JS fails. Shown once per browser session.
 */
export function Preloader({ name }: { name: string }) {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    try {
      sessionStorage.setItem('intro-seen', '1')
    } catch {}
    const t = setTimeout(() => setGone(true), 2600)
    return () => clearTimeout(t)
  }, [])
  if (gone) return null
  return (
    <>
      {/* runs before first paint: skip the intro on repeat visits without a flash */}
      <script dangerouslySetInnerHTML={{ __html: "try{sessionStorage.getItem('intro-seen')&&document.documentElement.classList.add('intro-seen')}catch(e){}" }} />
      <div className="preloader" aria-hidden>
        <Logo className="preloader-mark" />
        <p className="preloader-name">{name}</p>
      </div>
    </>
  )
}
