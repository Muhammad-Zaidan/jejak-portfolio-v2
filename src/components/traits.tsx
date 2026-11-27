'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

// Each trait's signal, drawn across the whole screen: x 0..1, t seconds; returns roughly -1..1.
const waves: ((x: number, t: number) => number)[] = [
  (x, t) => 0.28 * Math.sin(Math.PI * 2 * (1.2 * x - t * 0.18)), // calm: a slow, low swell
  (x, t) => 0.5 * Math.tanh(14 * Math.sin(Math.PI * 2 * (4 * x - t * 0.35))), // precise: a clean square wave
  (x, t) => ((((5 * x - t * 0.8) % 1) + 1) % 1 - 0.5) * (0.2 + 1.3 * x), // hungry: a sawtooth that keeps climbing
  (x, t) => 0.38 * Math.sin(Math.PI * 2 * (6 * x - t * 1.1)) * Math.sin(Math.PI * 2 * (0.7 * x + t * 0.3)) + 0.14 * Math.sin(Math.PI * 2 * (15 * x + 2 * t)), // fun
]

/**
 * The "Who" story: one trait per screen, each set in its own voice (calm in a quiet serif, precise in mono, hungry
 * huge and loud, fun bouncing letter by letter), with an electric signal running edge to edge behind it that changes
 * shape as the visitor scrolls. No buttons: the page tells it.
 */
export function Traits({ words, stories, hints }: { words: [string, string][]; stories: [string, string][]; hints: string[] }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(0)
  // easter eggs: holding "calm" hushes the signal, feeding "hungry" grows it, "precise" measures itself, "fun" scatters
  const hush = useRef(0)
  const holding = useRef(false)
  const fed = useRef(0)
  const [feeds, setFeeds] = useState(0)
  const [ruler, setRuler] = useState('')
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    const el = box.current!, cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const orange = getComputedStyle(cv).getPropertyValue('--orange').trim() || '#ff5a1f'
    const n = words.length
    let W = 0, H = 0, raf = 0, seen = false, shown = -1, smooth = 0
    const pointer = { x: -1e4, y: -1e4 }

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
      const t = calm ? 0 : now / 1000
      const r = el.getBoundingClientRect()
      const target = Math.min(n - 0.001, Math.max(0, (-r.top / Math.max(1, r.height - innerHeight)) * n))
      smooth += (target - smooth) * 0.1
      const i = Math.floor(smooth), frac = smooth - i
      const s = Math.min(n - 1, Math.floor(target))
      if (s !== shown) setActive((shown = s))
      // hold each signal, then morph to the next over the last third of its screen
      const k = Math.max(0, (frac - 0.66) / 0.34), mix = k * k * (3 - 2 * k)
      const a = waves[i % waves.length], b = waves[Math.min(n - 1, i + 1) % waves.length]

      ctx.clearRect(0, 0, W, H)
      hush.current += ((holding.current ? 1 : 0) - hush.current) * 0.06
      const grow = 1 + Math.min(fed.current, 8) * 0.09 * (i === 2 ? 1 : 0)
      const mid = H * 0.5, amp = Math.min(H * 0.32, 220) * (1 - hush.current * 0.97) * grow
      ctx.lineJoin = ctx.lineCap = 'round'
      ctx.globalCompositeOperation = 'lighter'
      for (const [width, alpha] of [[14, 0.07], [5, 0.16], [1.8, 0.95]] as const) {
        ctx.strokeStyle = orange
        ctx.globalAlpha = alpha
        ctx.lineWidth = width
        ctx.beginPath()
        for (let px = 0; px <= W; px += 3) {
          const x = px / W
          let y = mid - (a(x, t) * (1 - mix) + b(x, t) * mix) * amp
          const d = Math.hypot(px - pointer.x, y - pointer.y)
          if (d < 160) y += Math.sin(t * 20 + px * 0.06) * 14 * (1 - d / 160) ** 2
          if (px) ctx.lineTo(px, y)
          else ctx.moveTo(px, y)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      raf = seen ? requestAnimationFrame(frame) : 0
    }

    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    addEventListener('pointermove', move, { passive: true })
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      if (seen && !raf) raf = requestAnimationFrame(frame)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      ro.disconnect()
      removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [words.length])

  return (
    <div ref={box} className="traits" style={{ height: `${words.length * 90 + 30}vh` }}>
      <div className="traits-stage">
        <canvas ref={canvas} className="traits-wave" aria-hidden />
        {words.map(([word, line], i) => {
          const egg = i % 4
          const act = () => {
            if (egg === 1) {
              const el = document.getElementById(`trait-word-${i}`)
              setRuler(el ? `${el.getBoundingClientRect().width.toFixed(2).replace('.', ',')} px` : '')
            }
            if (egg === 2) setFeeds((fed.current += 1))
            if (egg === 3) setBurst((b) => b + 1)
          }
          return (
            <div key={word} className={`trait trait-${egg} ${i === active ? 'is-on' : i < active ? 'is-past' : ''}`} aria-hidden={i !== active}>
              <button
                type="button"
                id={`trait-word-${i}`}
                className={`trait-word ${egg === 3 && burst % 2 ? 'is-scattered' : ''}`}
                tabIndex={i === active ? 0 : -1}
                onClick={act}
                onPointerDown={() => egg === 0 && (holding.current = true)}
                onPointerUp={() => (holding.current = false)}
                onPointerLeave={() => (holding.current = false)}
                onMouseEnter={() => egg === 1 && act()}
              >
                {[...word].map((ch, j) => (
                  <span key={j} style={{ '--i': j, '--r': `${((j * 137 + burst * 61) % 90) - 45}deg`, '--x': `${((j * 53 + burst * 29) % 80) - 40}px`, '--y': `${((j * 71 + burst * 17) % 60) - 50}px` } as CSSProperties}>{ch}</span>
                ))}
                {egg === 1 && ruler && <span className="trait-ruler" aria-hidden>{ruler}</span>}
              </button>
              <p className="trait-line">{line}</p>
              {/* a field note in the opposite corner: where and when, the moment itself (key phrases set heavier), the hint */}
              <div className="trait-note">
                {stories[i] && (
                  <>
                    <p className="trait-when">{stories[i][0]}</p>
                    <p className="trait-story">
                      {stories[i][1].split(/(\*[^*]+\*)/).map((part, k) => (part.startsWith('*') ? <b key={k}>{part.slice(1, -1)}</b> : <span key={k}>{part}</span>))}
                    </p>
                  </>
                )}
                <p className="trait-hint">{egg === 2 && feeds > 0 ? hints[4]?.replace('{n}', String(feeds)) : hints[egg]}</p>
              </div>
            </div>
          )
        })}
        <p className="traits-count" aria-hidden>
          {String(active + 1).padStart(2, '0')} <span>/ {String(words.length).padStart(2, '0')}</span>
        </p>
      </div>
    </div>
  )
}
