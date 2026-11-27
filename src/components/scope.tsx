'use client'
import { useEffect, useRef, useState } from 'react'

// A single-stroke vector alphabet on a 4×6 grid (y down), the way an oscilloscope beam would draw letters.
type Stroke = [number, number][]
const O: Stroke = [[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]]
const P: Stroke = [[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]
const FONT: Record<string, Stroke[]> = {
  A: [[[0, 6], [0, 2], [2, 0], [4, 2], [4, 6]], [[0, 3.5], [4, 3.5]]],
  B: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]],
  D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  G: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3.5], [2.2, 3.5]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]],
  J: [[[4, 0], [4, 5], [3, 6], [1, 6], [0, 5]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.5]], [[1.3, 2.7], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [O],
  P: [P],
  Q: [O, [[2.5, 4.5], [4, 6]]],
  R: [P, [[2, 3], [4, 6]]],
  S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 3], [3, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
}
const N = 900 // beam samples per word; every word is resampled to this so one can morph into another
type Pt = { x: number; y: number; on: boolean } // `on`: beam visible (off while it jumps between strokes)

/** A word as one continuous beam path, in units where the word is centred on 0,0 and 6 units tall. */
function beamPath(word: string): Pt[] {
  const strokes: Stroke[] = []
  const letters = [...word.toUpperCase()]
  letters.forEach((ch, i) => (FONT[ch] ?? []).forEach((s) => strokes.push(s.map(([x, y]) => [x + i * 5.6, y]))))
  if (!strokes.length) strokes.push([[0, 3], [4, 3]])
  const w = Math.max(4, letters.length * 5.6 - 1.6)
  const pts: Pt[] = []
  strokes.forEach((s) => s.forEach(([x, y], k) => pts.push({ x: x - w / 2, y: y - 3, on: k > 0 })))
  // resample by length; jumps count for less, so the beam spends its time drawing
  const len = [0]
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) * (pts[i].on ? 1 : 0.25))
  const out: Pt[] = []
  for (let k = 0, j = 1; k < N; k++) {
    const at = (k / (N - 1)) * len[len.length - 1]
    while (j < pts.length - 1 && len[j] < at) j++
    const f = len[j] === len[j - 1] ? 0 : (at - len[j - 1]) / (len[j] - len[j - 1])
    out.push({ x: pts[j - 1].x + (pts[j].x - pts[j - 1].x) * f, y: pts[j - 1].y + (pts[j].y - pts[j - 1].y) * f, on: pts[j].on })
  }
  return out
}

// Each trait's character, as a wobble on the beam: x across the word 0..1, t in seconds.
const wobble: ((x: number, t: number) => number)[] = [
  (x, t) => 0.18 * Math.sin(Math.PI * 2 * (0.8 * x - t * 0.3)), // calm: a slow swell
  () => 0, // precise: dead steady
  (x, t) => 0.22 * ((((2.5 * x - t * 0.7) % 1) + 1) % 1 - 0.5), // hungry: a climbing sawtooth
  (x, t) => 0.2 * Math.sin(Math.PI * 2 * (3 * x - t)) * Math.sin(Math.PI * 2 * (0.5 * x + t * 0.4)), // fun
]

/**
 * The "Who" chapter's centrepiece: an oscilloscope whose beam writes each trait in glowing phosphor. Picking a trait
 * morphs the trace from one word into the next; the pointer bends the beam near it. Runs only while on screen.
 */
export function Scope({ words }: { words: [string, string][] }) {
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const target = useRef(0) // the trait to draw, read by the animation loop
  useEffect(() => {
    target.current = active
  }, [active])

  // left alone, the scope steps through the traits
  useEffect(() => {
    if (held) return
    const id = setInterval(() => setActive((a) => (a + 1) % words.length), 4200)
    return () => clearInterval(id)
  }, [held, words.length])

  useEffect(() => {
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const paths = words.map(([w]) => beamPath(w))
    let shown = target.current
    let from = paths[shown], to = paths[shown], mix = 1
    let head = 0 // beam position along the path, 0..1
    let W = 0, H = 0, raf = 0, seen = false, last = 0
    const pointer = { x: -1e4, y: -1e4 }
    const orange = getComputedStyle(cv).getPropertyValue('--orange').trim() || '#ff5a1f'

    const resize = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio)
      W = r.width; H = r.height
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    resize()

    // where sample i sits on screen right now
    const at = (i: number, t: number, k: number, unit: number) => {
      const a = from[i], b = to[i]
      const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k
      const sx = W / 2 + x * unit
      let sy = H * 0.42 + (y + wobble[shown % wobble.length]((x * unit) / W + 0.5, t) * 6) * unit
      const d = Math.hypot(sx - pointer.x, sy - pointer.y)
      if (d < 120) sy += Math.sin(t * 22 + sx * 0.08) * 9 * (1 - d / 120) ** 2
      return { x: sx, y: sy, on: k < 0.5 ? a.on : b.on }
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000)
      last = now
      const t = now / 1000
      if (target.current !== shown) {
        // morph from wherever the trace is now
        const k = mix * mix * (3 - 2 * mix)
        from = from.map((a, i) => ({ x: a.x + (to[i].x - a.x) * k, y: a.y + (to[i].y - a.y) * k, on: k < 0.5 ? a.on : to[i].on }))
        shown = target.current
        to = paths[shown % paths.length]
        mix = 0
      }
      mix = Math.min(1, mix + dt / 0.9)
      const k = mix * mix * (3 - 2 * mix)
      const span = Math.max(...to.map((p) => Math.abs(p.x)), ...from.map((p) => Math.abs(p.x)), 1)
      const unit = Math.min((W * 0.42) / span, H / 11)

      // phosphor: what was drawn fades rather than vanishing
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = `rgba(0,0,0,${calm ? 1 : 1 - Math.exp(-dt * 1.8)})`
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = ctx.lineJoin = 'round'

      // the beam sweeps the whole word about once a second; calm motion draws it whole
      const a0 = calm ? 0 : head, a1 = calm ? 1 : head + dt / 0.85
      head = a1 % 1
      const i0 = Math.floor(a0 * (N - 1)), i1 = Math.floor(a1 * (N - 1))
      for (const [width, alpha] of [[12, 0.1], [2.6, 0.9]] as const) {
        ctx.strokeStyle = orange
        ctx.globalAlpha = alpha
        ctx.lineWidth = width
        ctx.beginPath()
        let prev = at(i0 % N, t, k, unit)
        for (let i = i0 + 1; i <= i1; i++) {
          const p = at(i % N, t, k, unit)
          if (p.on && i % N !== 0) (ctx.moveTo(prev.x, prev.y), ctx.lineTo(p.x, p.y))
          prev = p
        }
        ctx.stroke()
      }
      // the bright spot where the beam is
      if (!calm) {
        const p = at(i1 % N, t, k, unit)
        ctx.globalAlpha = 1
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = seen && (!calm || mix < 1) ? requestAnimationFrame(frame) : 0
    }

    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    const leave = () => ((pointer.x = -1e4), (pointer.y = -1e4))
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerleave', leave)
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      if (seen && !raf) raf = requestAnimationFrame(frame)
    })
    io.observe(cv)
    return () => {
      io.disconnect()
      ro.disconnect()
      cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [words])

  return (
    <div className="scope" onMouseLeave={() => setHeld(false)}>
      <div className="scope-screen">
        <svg viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden>
          {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 60} x2={i * 60} y1={0} y2={240} className="scope-grid" />)}
          {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1={0} x2={600} y1={i * 60} y2={i * 60} className="scope-grid" />)}
        </svg>
        <canvas ref={canvas} className="scope-beam" aria-hidden />
        <p className="scope-readout" aria-live="polite">
          <span className="sr-only">{words[active][0]}. </span>
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
