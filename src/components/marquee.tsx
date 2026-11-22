'use client'
import { useEffect, useRef } from 'react'

/** Giant lines of type that drift sideways, faster while the page scrolls, in opposite directions. */
export function Marquee({ rows }: { rows: string[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let pos = 0
    let last = scrollY
    let boost = 0
    const tick = () => {
      boost = boost * 0.92 + Math.abs(scrollY - last) * 0.08 // scrolling pushes the type along
      last = scrollY
      pos += 0.35 + boost * 0.6
      refs.current.forEach((el, i) => {
        if (!el) return
        const half = el.scrollWidth / 2 // content is doubled, so wrapping at half is seamless
        const x = (pos * (i % 2 ? 1 : -1)) % half
        el.style.transform = `translate3d(${i % 2 ? x - half : x}px,0,0)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="marquee pointer-events-none select-none" aria-hidden>
      {rows.map((text, i) => (
        <div key={i} ref={(el) => { refs.current[i] = el }} className={`marquee-row ${i % 2 ? 'marquee-outline' : ''}`}>
          <span>{text}&nbsp;</span>
          <span>{text}&nbsp;</span>
        </div>
      ))}
    </div>
  )
}
