import type { Entry } from '@/lib/content'

/** Seeded random numbers, so a post always gets the same artwork. */
function rng(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1)
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61)
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296
  }
}

const W = 400
const H = 300
const f = (n: number) => n.toFixed(1)

/** Contour rings, like a terrain map (and like the hologram's depth lines): projects. */
function contours(r: () => number) {
  const cx = 120 + r() * 160
  const cy = 90 + r() * 120
  const waves = [2, 3, 5].map((k) => ({ k, a: 0.04 + r() * 0.1, p: r() * 6.28 }))
  return Array.from({ length: 11 }, (_, i) => {
    const R = 18 + i * 22
    const pts = Array.from({ length: 73 }, (_, j) => {
      const t = (j / 72) * Math.PI * 2
      const k = 1 + waves.reduce((s, w) => s + w.a * Math.sin(w.k * t + w.p + i * 0.35), 0)
      return `${f(cx + Math.cos(t) * R * k * 1.25)},${f(cy + Math.sin(t) * R * k)}`
    })
    return `M${pts.join('L')}Z`
  })
}

/** Right-angled traces ending in pads, like a circuit board: things I build. */
function traces(r: () => number) {
  return Array.from({ length: 9 }, () => {
    let x = Math.round(r() * 10) * 40
    let y = Math.round(r() * 7) * 40 + 10
    const pts = [[x, y]]
    for (let s = 0; s < 4; s++) {
      if (s % 2 === 0) x = Math.max(0, Math.min(W, x + (r() > 0.5 ? 1 : -1) * (40 + Math.round(r() * 3) * 40)))
      else y = Math.max(10, Math.min(H - 10, y + (r() > 0.5 ? 1 : -1) * (20 + Math.round(r() * 2) * 20)))
      pts.push([x, y])
    }
    return { d: `M${pts.map(([a, b]) => `${a},${b}`).join('L')}`, end: pts[pts.length - 1] }
  })
}

/** Stacked signal lines: things I learn. */
function signals(r: () => number) {
  const freq = 2 + r() * 3
  const phase = r() * 6.28
  return Array.from({ length: 14 }, (_, i) => {
    const y0 = 30 + i * 18
    const amp = 6 + 22 * Math.exp(-(((i - 6.5) / 4) ** 2))
    const pts = Array.from({ length: 81 }, (_, j) => {
      const x = (j / 80) * W
      return `${f(x)},${f(y0 + amp * Math.sin((x / W) * freq * 6.28 + phase + i * 0.4) * Math.sin((x / W) * Math.PI))}`
    })
    return `M${pts.join('L')}`
  })
}

/** Ripples spreading from a few points: thoughts. */
function ripples(r: () => number) {
  return Array.from({ length: 3 }, () => ({ x: 40 + r() * 320, y: 40 + r() * 220, n: 4 + Math.floor(r() * 5) }))
}

/**
 * A post's thumbnail: its photo when it has one, otherwise artwork drawn from the post itself (its slug picks the
 * shapes, its category picks the motif), in the site's own palette so photo-less posts still sit well together.
 */
export function Cover({ e, label, className = '' }: { e: Pick<Entry, 'slug' | 'category' | 'cover_url' | 'title_id' | 'title_en'>; label?: string; className?: string }) {
  if (e.cover_url)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={e.cover_url} alt="" loading="lazy" className={`cover ${className}`} />
    )
  const r = rng(e.slug ?? e.title_id)
  const line = { fill: 'none', stroke: 'var(--fg)', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' } as const
  const accent = { ...line, stroke: 'var(--orange)', strokeWidth: 1.6 }
  const initial = (e.title_id || e.title_en || '·').trim().charAt(0).toUpperCase()
  const id = `dots-${(e.slug ?? 'x').slice(0, 24)}`
  let art: React.ReactNode
  if (e.category === 'work') {
    const ts = traces(r)
    art = ts.map((t, i) => (
      <g key={i}>
        <path d={t.d} style={i === 0 ? accent : { ...line, opacity: 0.45 }} />
        <circle cx={t.end[0]} cy={t.end[1]} r={3.2} style={{ fill: i === 0 ? 'var(--orange)' : 'var(--fg)', opacity: i === 0 ? 1 : 0.5 }} />
      </g>
    ))
  } else if (e.category === 'learn') {
    art = signals(r).map((d, i) => <path key={i} d={d} style={i === 6 ? accent : { ...line, opacity: 0.4 }} />)
  } else if (e.category === 'thought') {
    art = ripples(r).flatMap((p, k) =>
      Array.from({ length: p.n }, (_, i) => (
        <circle key={`${k}-${i}`} cx={p.x} cy={p.y} r={10 + i * 16} style={k === 0 && i === 1 ? accent : { ...line, opacity: 0.38 - i * 0.04 }} />
      )),
    )
  } else {
    art = contours(r).map((d, i) => <path key={i} d={d} style={i === 3 ? accent : { ...line, opacity: 0.4 }} />)
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} className={`cover cover-art ${className}`}>
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="0.9" style={{ fill: 'var(--fg)', opacity: 0.22 }} />
        </pattern>
      </defs>
      <rect width={W} height={H} style={{ fill: 'var(--tint)' }} />
      <rect width={W} height={H} fill={`url(#${id})`} />
      {art}
      <text x={W - 18} y={H - 14} textAnchor="end" className="cover-initial">{initial}</text>
      {label && <text x={18} y={30} className="cover-label">{label.toUpperCase()}</text>}
    </svg>
  )
}
