'use client'
import Lenis from 'lenis'
import { useEffect } from 'react'

/** Inertial page scrolling, as on the reference sites. Off for people who ask for less motion. */
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: true })
    return () => lenis.destroy()
  }, [])
  return null
}
