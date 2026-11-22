'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * A horizontal gallery driven by vertical scrolling: the section pins to the screen while its track slides sideways
 * (as the reference sites show their collections). On narrow screens it is a plain swipeable row instead.
 */
export function Rail({ label, children }: { label: string; children: React.ReactNode }) {
  const outer = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const [height, setHeight] = useState<number>()

  useEffect(() => {
    const o = outer.current!
    const tr = track.current!
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    let travel = 0
    let raf = 0
    const measure = () => {
      const pin = !calm && innerWidth >= 900
      setPinned(pin)
      travel = Math.max(0, tr.scrollWidth - innerWidth)
      setHeight(pin ? innerHeight + travel : undefined)
      if (!pin) tr.style.transform = ''
    }
    const update = () => {
      raf = 0
      if (innerWidth < 900 || calm) return
      const p = Math.min(1, Math.max(0, -o.getBoundingClientRect().top / Math.max(1, travel)))
      tr.style.transform = `translate3d(${-p * travel}px, 0, 0)`
      o.style.setProperty('--p', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    measure()
    update()
    const ro = new ResizeObserver(() => {
      measure()
      update()
    })
    ro.observe(tr)
    addEventListener('resize', measure)
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      removeEventListener('resize', measure)
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={outer} aria-label={label} className={`rail ${pinned ? 'is-pinned' : ''}`} style={{ height }}>
      <div className="rail-sticky">
        <div ref={track} className="rail-track">
          {children}
        </div>
        <div className="rail-progress" aria-hidden />
      </div>
    </section>
  )
}
