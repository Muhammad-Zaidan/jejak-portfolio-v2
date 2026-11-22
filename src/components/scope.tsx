'use client'
import { useEffect, useRef, useState } from 'react'

const W = 600
const H = 240
const N = 160

// Each trait drawn as a signal on an oscilloscope: x in 0..1 across the screen, t in seconds; returns -1..1.
const waves: ((x: number, t: number) => number)[] = [
  (x, t) => 0.32 * Math.sin(Math.PI * 2 * (1.5 * x - t * 0.25)), // calm: a slow, low sine
  (x, t) => 0.62 * Math.tanh(9 * Math.sin(Math.PI * 2 * (3 * x - t * 0.4))), // precise: a clean square wave
  (x, t) => (((4 * x - t * 0.6) % 1 + 1) % 1 - 0.5) * (0.3 + 1.2 * x), // hungry: a sawtooth that keeps climbing
  (x, t) => 0.42 * Math.sin(Math.PI * 2 * (5 * x - t)) * Math.sin(Math.PI * 2 * (0.6 * x + t * 0.3)) + 0.16 * Math.sin(Math.PI * 2 * (13 * x + 2 * t)), // fun
]

/**
 * The "Who" chapter's centrepiece: an oscilloscope showing each trait as a signal. Pointing at a trait morphs the
 * trace into its waveform; left alone it moves on by itself. Runs only while on screen.
 */
export function Scope({ words }: { words: [string, string][] }) {
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const path = useRef<SVGPathElement>(null)
  const glow = useRef<SVGPathElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const target = useRef(0) // the trait to draw, read by the animation loop
  useEffect(() => {
    target.current = active
  }, [active])

  // left alone, the scope steps through the traits
  useEffect(() => {
    if (held) return
    const id = setInterval(() => setActive((a) => (a + 1) % words.length), 3800)
    return () => clearInterval(id)
  }, [held, words.length])

  useEffect(() => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let seen = false
    let from = target.current
    let shown = target.current
    let mix = 1
    const t0 = performance.now()
    const draw = () => {
      const t = calm ? 0 : (performance.now() - t0) / 1000
      if (target.current !== shown) {
        from = shown
        shown = target.current
        mix = 0
      }
      mix = Math.min(1, mix + 0.035)
      const k = mix * mix * (3 - 2 * mix) // ease in and out between two signals
      let d = ''
      for (let i = 0; i <= N; i++) {
        const x = i / N
        const y = waves[from % waves.length](x, t) * (1 - k) + waves[shown % waves.length](x, t) * k
        d += `${i ? 'L' : 'M'}${(x * W).toFixed(1)},${(H / 2 - y * (H * 0.42)).toFixed(1)}`
      }
      path.current?.setAttribute('d', d)
      glow.current?.setAttribute('d', d)
      raf = seen && !calm ? requestAnimationFrame(draw) : 0
    }
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      if (seen && !raf) raf = requestAnimationFrame(draw)
    })
    io.observe(box.current!)
    draw()
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={box} className="scope" onMouseLeave={() => setHeld(false)}>
      <div className="scope-screen">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={(i * W) / 10} x2={(i * W) / 10} y1={0} y2={H} className="scope-grid" />)}
          {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1={0} x2={W} y1={(i * H) / 4} y2={(i * H) / 4} className="scope-grid" />)}
          <path ref={glow} className="scope-glow" />
          <path ref={path} className="scope-trace" />
        </svg>
        <p className="scope-readout" aria-live="polite">
          <span className="scope-name">{words[active][0]}</span>
          <span>{words[active][1]}</span>
        </p>
      </div>
      <div className="scope-keys" role="tablist" aria-label="Sifat">
        {words.map(([word], i) => (
          <button
            key={word}
            role="tab"
            aria-selected={i === active}
            onMouseEnter={() => (setActive(i), setHeld(true))}
            onFocus={() => (setActive(i), setHeld(true))}
            onClick={() => (setActive(i), setHeld(true))}
            className="scope-key"
          >
            <span className="scope-led" aria-hidden />
            {word}
          </button>
        ))}
      </div>
    </div>
  )
}
