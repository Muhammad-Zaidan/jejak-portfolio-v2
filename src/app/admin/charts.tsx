// Small server-rendered SVG charts for the back office. Ink for the reference series, accent for the one that matters.

const short = (n: number) =>
  Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',')}jt` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)}rb` : String(Math.round(n))

/** Bars in groups: one group per label, one bar per series. */
export function Bars({ labels, series, height = 180 }: { labels: string[]; series: { name: string; values: number[]; accent?: boolean; ghost?: boolean }[]; height?: number }) {
  const W = 600, H = height, pad = 22
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const gw = (W - 10) / labels.length
  const bw = Math.min(34, (gw - 18) / series.length)
  return (
    <figure className="grid gap-2">
      <svg viewBox={`0 0 ${W} ${H + pad}`} className="w-full" role="img" aria-label={series.map((s) => `${s.name}: ${s.values.map(short).join(', ')}`).join('; ')}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="currentColor" strokeOpacity={0.2} />
        {labels.map((l, g) => {
          const x0 = 5 + g * gw + (gw - bw * series.length) / 2
          return (
            <g key={l}>
              {series.map((s, k) => {
                const v = s.values[g] ?? 0, h = (v / max) * (H - 18)
                return (
                  <g key={s.name}>
                    <rect x={x0 + k * bw + 2} y={H - h} width={bw - 4} height={h} rx={4} fill={s.accent ? 'var(--accent)' : 'currentColor'} fillOpacity={s.ghost ? 0.18 : s.accent ? 1 : 0.55} />
                    {v > 0 && <text x={x0 + k * bw + bw / 2} y={H - h - 5} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.7}>{short(v)}</text>}
                  </g>
                )
              })}
              <text x={5 + g * gw + gw / 2} y={H + 16} textAnchor="middle" fontSize={12} fill="currentColor" fillOpacity={0.65}>{l}</text>
            </g>
          )
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: s.accent ? 'var(--accent)' : 'currentColor', opacity: s.ghost ? 0.25 : s.accent ? 1 : 0.55 }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

/** A line with a soft area under it, for a balance over time. */
export function Line({ labels, values, height = 160 }: { labels: string[]; values: number[]; height?: number }) {
  const W = 600, H = height, pad = 22
  const lo = Math.min(0, ...values), hi = Math.max(1, ...values)
  const x = (i: number) => 20 + (i * (W - 40)) / Math.max(1, values.length - 1)
  const y = (v: number) => 26 + (1 - (v - lo) / (hi - lo || 1)) * (H - 40)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')
  return (
    <svg viewBox={`0 0 ${W} ${H + pad}`} className="w-full" role="img" aria-label={labels.map((l, i) => `${l}: ${short(values[i])}`).join(', ')}>
      {lo < 0 && <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 4" />}
      <path d={`${d}L${x(values.length - 1)},${H}L${x(0)},${H}Z`} fill="var(--accent)" fillOpacity={0.1} />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
      {values.map((v, i) => (
        <g key={labels[i]}>
          <circle cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 5 : 3} fill="var(--accent)" />
          <text x={x(i)} y={y(v) - 10} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.7}>{short(v)}</text>
          <text x={x(i)} y={H + 16} textAnchor="middle" fontSize={12} fill="currentColor" fillOpacity={0.65}>{labels[i]}</text>
        </g>
      ))}
    </svg>
  )
}

/** One row per item: this period as a bar, the earlier average as a tick. */
export function Compare({ rows }: { rows: { name: string; now: number; before: number }[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.now, r.before]))
  return (
    <ul className="grid gap-3">
      {rows.map((r) => {
        const d = r.before ? (r.now - r.before) / r.before : null
        return (
          <li key={r.name} className="grid grid-cols-[7rem_1fr_6.5rem] items-center gap-3 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="relative h-3 rounded-full bg-surface">
              <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${(r.now / max) * 100}%` }} />
              {r.before > 0 && <span className="absolute -inset-y-1 w-0.5 rounded bg-ink" style={{ left: `${(r.before / max) * 100}%` }} title="rata-rata bulan sebelumnya" />}
            </span>
            <span className="text-right tabular-nums">
              {short(r.now)}
              {d !== null && <span className={`ml-1 text-xs ${d > 0.1 ? 'text-accent' : 'text-muted'}`}>{d > 0 ? '▲' : '▼'}{Math.abs(Math.round(d * 100))}%</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
