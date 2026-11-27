'use client'
import { useEffect, useRef, useState } from 'react'

const COUNT = 280
const KEEP = 0.38 // share of dots that survive "cut what isn't needed"

// Seeded so the scene is the same on every visit and between server and client.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

type Dot = { sx: number; sy: number; cluster: number; cx: number; cy: number; keep: boolean; gx: number; gy: number; phase: number }

/** Where each dot sits in each scene, in 0..1 units of the stage. Built once. */
function makeDots(): Dot[] {
  const r = rng(7)
  const centers = [[0.2, 0.3], [0.5, 0.22], [0.8, 0.32], [0.32, 0.7], [0.7, 0.68]]
  const dots: Dot[] = []
  for (let i = 0; i < COUNT; i++) {
    const c = i % centers.length
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.11
    dots.push({ sx: r(), sy: r(), cluster: c, cx: centers[c][0] + Math.cos(a) * d, cy: centers[c][1] + Math.sin(a) * d * 1.3, keep: i === 0 || r() < KEEP, gx: 0, gy: 0, phase: r() * 100 })
  }
  // the survivors line up in a neat grid, the one that matters first
  let kept = dots.filter((d) => d.keep)
  const cols = Math.ceil(Math.sqrt(kept.length * 2.2))
  const rows = Math.floor(kept.length / cols)
  // no ragged last row: the extras get cut too
  kept.slice(rows * cols).forEach((d) => (d.keep = false))
  kept = kept.slice(0, rows * cols)
  kept.forEach((d, k) => {
    d.gx = 0.14 + (0.72 * (k % cols)) / Math.max(1, cols - 1)
    d.gy = 0.5 - (rows - 1) * 0.045 + Math.floor(k / cols) * 0.09
  })
  return dots
}

const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2)
const mix = (a: number, b: number, u: number) => a + (b - a) * u

/**
 * "How I work", acted out as you scroll: a noisy cloud of dots calms down (listen), gathers into groups (map), one
 * lights up (find the one thing), the rest fall away (cut), and what remains snaps into order (tidy). Each step's
 * text sits beside the stage; the stage pins while the five steps play.
 */
export function Process({ steps }: { steps: string[] }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const el = box.current!, cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const dots = makeDots()
    let fg = '#eee', orange = '#ff5a1f'
    const colours = () => {
      const css = getComputedStyle(cv)
      fg = css.getPropertyValue('--fg').trim() || fg
      orange = css.getPropertyValue('--orange').trim() || orange
    }
    colours()
    addEventListener('themechange', colours)
    let W = 0, H = 0, raf = 0, seen = false, shown = -1, smooth = 0

    const resize = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio)
      W = r.width; H = r.height
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    resize()

    const frame = (now: number) => {
      const t = now / 1000
      const r = el.getBoundingClientRect()
      const target = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))) * steps.length
      smooth += (target - smooth) * 0.12 // a touch of lag so fast scrolling still reads as motion
      const f = smooth
      const s = Math.min(steps.length - 1, Math.floor(target))
      if (s !== shown) setStep((shown = s))

      // how far into each scene change we are, 0..1
      const listen = ease(Math.min(1, f)), map = ease(Math.min(1, Math.max(0, f - 1))), one = ease(Math.min(1, Math.max(0, f - 2)))
      const cut = ease(Math.min(1, Math.max(0, f - 3))), tidy = ease(Math.min(1, Math.max(0, f - 4)))

      ctx.clearRect(0, 0, W, H)
      const unit = Math.min(W, H * 1.6)
      const ox = (W - unit) / 2, oy = (H - unit / 1.6) / 2, uh = unit / 1.6
      // map: faint threads from each dot to its group's centre, gone again once things are cut
      const thread = map * (1 - cut) * 0.16
      for (const d of dots) {
        const jitter = (1 - listen) * 0.035 + 0.003 * (1 - tidy)
        let x = mix(d.sx, d.cx, map) + Math.sin(t * 1.7 + d.phase) * jitter
        let y = mix(d.sy, d.cy, map) + Math.cos(t * 1.3 + d.phase * 1.3) * jitter
        let alpha = 0.75
        if (!d.keep) {
          y += cut * cut * 1.2 // falls off the bottom
          alpha *= 1 - cut
        } else {
          x = mix(x, d.gx, tidy)
          y = mix(y, d.gy, tidy)
        }
        if (one > 0 && d !== dots[0]) alpha *= 1 - one * 0.55 * (1 - tidy)
        if (alpha <= 0.01) continue
        const px = ox + x * unit, py = oy + y * uh
        if (thread > 0.01) {
          ctx.strokeStyle = fg
          ctx.globalAlpha = thread * alpha
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(px, py)
          const c = dots[d.cluster]
          ctx.lineTo(ox + mix(c.sx, c.cx, map) * unit, oy + mix(c.sy, c.cy, map) * uh)
          ctx.stroke()
        }
        const lead = d === dots[0]
        ctx.globalAlpha = lead ? 1 : alpha
        ctx.fillStyle = lead && one > 0 ? orange : fg
        ctx.beginPath()
        ctx.arc(px, py, lead ? 2.4 + one * 5 : 2.2, 0, Math.PI * 2)
        ctx.fill()
        if (lead && one > 0) {
          ctx.globalAlpha = 0.18 * one
          ctx.beginPath()
          ctx.arc(px, py, 18 + Math.sin(t * 3) * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      raf = seen ? requestAnimationFrame(frame) : 0
    }

    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      if (seen && !raf) raf = requestAnimationFrame(frame)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      ro.disconnect()
      removeEventListener('themechange', colours)
      cancelAnimationFrame(raf)
    }
  }, [steps.length])

  return (
    <div ref={box} className="process" style={{ height: `${steps.length * 70 + 60}vh` }}>
      <div className="process-stage">
        <canvas ref={canvas} className="process-canvas" aria-hidden />
        <ol className="process-steps">
          {steps.map((s, i) => (
            <li key={s} className={i === step ? 'is-on' : i < step ? 'is-past' : ''}>
              <span className="process-num">{String(i + 1).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
