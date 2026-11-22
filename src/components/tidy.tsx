'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { compareOrder } from '@/lib/tidy'

type Text = {
  dropHere: string
  tidyForMe: string
  again: string
  yourPos: string
  mine: string
  sameStart: string
  diffStart: string
  matches: string
}

// A loose card: centre, velocity, angle (deg), spin, size. Lives in the play area's coordinates.
type Body = { x: number; y: number; vx: number; vy: number; a: number; va: number; w: number; h: number; held: boolean }

const G = 2600 // px/s², gravity
const BOUNCE = 0.32
const MAGNET = 140 // px: how close a held card must come to an empty stop to be pulled in

/** Smooth movement between layouts where the browser supports view transitions. */
function animate(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  doc.startViewTransition(() => flushSync(update))
}

/**
 * "How I work" as a toy: the steps drop into the section as physical cards. Grab, throw, knock them about; bring one
 * near a numbered stop and it snaps in. Fill all five to compare your order with mine.
 */
export function Tidy({ steps, t }: { steps: string[]; t: Text }) {
  const empty = () => steps.map(() => null as number | null)
  const [slots, setSlots] = useState(empty)
  const [visitor, setVisitor] = useState<number[] | null>(null)
  const [done, setDone] = useState(false)
  const [near, setNear] = useState<number | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLButtonElement | null)[]>([])
  const stops = useRef<(HTMLLIElement | null)[]>([])
  const bodies = useRef(new Map<number, Body>())
  const kick = useRef<() => void>(() => {})
  const grab = useRef<{ i: number; dx: number; dy: number; px: number; py: number; t: number; moved: number } | null>(null)
  const slotsRef = useRef(slots)
  useEffect(() => {
    slotsRef.current = slots
  }, [slots])

  // All stops filled: keep the visitor's order, then let the cards slide into mine.
  useEffect(() => {
    if (done || slots.some((s) => s === null)) return
    const id = setTimeout(() => animate(() => {
      setVisitor(slots as number[])
      setSlots(steps.map((_, i) => i))
      setDone(true)
    }), 650)
    return () => clearTimeout(id)
  }, [slots, done, steps])

  // A card coming into the play area (first drop, or thrown back out of a stop) gets a body.
  const spawn = useCallback((i: number, from?: { x: number; y: number }) => {
    const el = cards.current[i]
    const box = area.current
    if (!el || !box) return
    const w = el.offsetWidth, h = el.offsetHeight
    const W = box.clientWidth
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    bodies.current.set(i, from
      ? { x: from.x, y: from.y, vx: (Math.random() - 0.5) * 500, vy: -900 - Math.random() * 400, a: 0, va: (Math.random() - 0.5) * 400, w, h, held: false }
      : calm
        ? { x: w / 2 + ((W - w) * i) / Math.max(1, steps.length - 1), y: box.clientHeight - h / 2 - (i % 2) * (h + 8), vx: 0, vy: 0, a: (i % 2 ? 3 : -4), va: 0, w, h, held: false }
        : { x: w / 2 + Math.random() * (W - w), y: -h * (1.2 + i * 1.1), vx: (Math.random() - 0.5) * 120, vy: 0, a: (Math.random() - 0.5) * 30, va: (Math.random() - 0.5) * 120, w, h, held: false })
    kick.current()
  }, [steps.length])

  // The simulation: runs while the section is on screen and something is still moving.
  useEffect(() => {
    const box = area.current!
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, last = 0, seen = false, started = false
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - (last || now)) / 1000)
      last = now
      const W = box.clientWidth, H = box.clientHeight
      const list = [...bodies.current.entries()]
      let moving = false
      for (const [, b] of list) {
        if (b.held) { moving = true; continue }
        if (!calm) {
          b.vy += G * dt
          b.x += b.vx * dt
          b.y += b.vy * dt
          b.va = Math.max(-360, Math.min(360, b.va))
          b.a += b.va * dt
          b.a = ((b.a + 180) % 360 + 360) % 360 - 180 // keep the tilt the short way round, so damping levels it
        }
        // walls and floor; resting cards ease their spin out
        if (b.x - b.w / 2 < 0) { b.x = b.w / 2; b.vx = Math.abs(b.vx) * BOUNCE }
        if (b.x + b.w / 2 > W) { b.x = W - b.w / 2; b.vx = -Math.abs(b.vx) * BOUNCE }
        if (b.y + b.h / 2 > H) {
          b.y = H - b.h / 2
          b.vy = Math.abs(b.vy) > 120 ? -Math.abs(b.vy) * BOUNCE : 0
          b.vx *= 0.86
          b.va *= 0.8
          b.a *= 0.94
        }
        if (Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.va) > 12) moving = true
      }
      // cards push each other apart (boxes, ignoring their small tilt) so they pile instead of overlapping
      for (let p = 0; p < list.length; p++)
        for (let q = p + 1; q < list.length; q++) {
          const A = list[p][1], B = list[q][1]
          const ox = (A.w + B.w) / 2 - Math.abs(A.x - B.x)
          const oy = (A.h + B.h) / 2 - Math.abs(A.y - B.y)
          if (ox <= 0 || oy <= 0) continue
          const wa = A.held ? 0 : B.held ? 1 : 0.5 // a held card is a wall
          if (oy < ox) {
            const s = A.y < B.y ? -1 : 1
            A.y += s * oy * wa; B.y -= s * oy * (1 - wa)
            const v = (A.vy + B.vy) / 2
            if (!A.held) A.vy = v; if (!B.held) B.vy = v
            const top = A.y < B.y ? A : B // a card resting on another settles like it would on the floor
            top.va *= 0.8
            top.a *= 0.94
          } else {
            const s = A.x < B.x ? -1 : 1
            A.x += s * ox * wa; B.x -= s * ox * (1 - wa)
            const v = (A.vx + B.vx) / 2
            if (!A.held) A.vx = v * 0.9; if (!B.held) B.vx = v * 0.9
          }
        }
      for (const [i, b] of list) {
        const el = cards.current[i]
        if (el) el.style.transform = `translate(${b.x - b.w / 2}px, ${b.y - b.h / 2}px) rotate(${b.a}deg)`
      }
      raf = seen && (moving || !started) ? requestAnimationFrame(step) : 0
      started = true
    }
    kick.current = () => {
      if (!raf && seen) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }
    // cards fall in the first time the toy comes into view
    let dropped = false
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      if (seen && !dropped) {
        dropped = true
        steps.forEach((_, i) => slotsRef.current.includes(i) || spawn(i))
      }
      kick.current()
    }, { threshold: 0.25 })
    io.observe(box)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [spawn, steps])

  // stop positions in play-area coordinates, for the magnet
  const stopNear = (x: number, y: number) => {
    const box = area.current!.getBoundingClientRect()
    let best: number | null = null, bestD = MAGNET
    stops.current.forEach((el, s) => {
      if (!el || slotsRef.current[s] !== null) return
      const r = el.getBoundingClientRect()
      const d = Math.hypot(r.left + r.width / 2 - box.left - x, r.top + Math.min(r.height / 2, 60) - box.top - y)
      if (d < bestD) (bestD = d, best = s)
    })
    return best
  }

  const dock = (card: number, slot: number) => {
    bodies.current.delete(card)
    animate(() => setSlots((cur) => cur.map((c, s) => (s === slot ? card : c === card ? null : c))))
  }
  const undock = (card: number) => {
    const el = stops.current[slots.indexOf(card)]
    const box = area.current!.getBoundingClientRect()
    const r = el?.getBoundingClientRect()
    flushSync(() => setSlots((cur) => cur.map((c) => (c === card ? null : c))))
    spawn(card, r ? { x: r.left + r.width / 2 - box.left, y: Math.min(box.height - 40, r.top - box.top) } : undefined)
  }

  const down = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    const b = bodies.current.get(i)
    if (done || !b) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const box = area.current!.getBoundingClientRect()
    const px = e.clientX - box.left, py = e.clientY - box.top
    b.held = true
    grab.current = { i, dx: b.x - px, dy: b.y - py, px, py, t: e.timeStamp, moved: 0 }
    kick.current()
  }
  const move = (e: PointerEvent) => {
    const box = area.current!.getBoundingClientRect()
    const px = e.clientX - box.left, py = e.clientY - box.top
    const g = grab.current
    if (!g) {
      // a quick pass of the pointer nudges loose cards out of its way
      for (const b of bodies.current.values()) {
        const d = Math.hypot(b.x - px, b.y - py)
        if (d < 90 && Math.abs(e.movementX) + Math.abs(e.movementY) > 8) {
          b.vx += e.movementX * 14
          b.vy += Math.min(0, e.movementY * 14) - 120
          b.va += e.movementX * 6
          kick.current()
        }
      }
      return
    }
    const b = bodies.current.get(g.i)
    if (!b) return
    const now = e.timeStamp, dt = Math.max(1, now - g.t) / 1000
    b.vx = b.vx * 0.5 + ((px - g.px) / dt) * 0.5 // remembered so a release throws the card
    b.vy = b.vy * 0.5 + ((py - g.py) / dt) * 0.5
    b.x = px + g.dx
    b.y = py + g.dy
    b.a = Math.max(-25, Math.min(25, b.vx * 0.02))
    g.moved += Math.abs(px - g.px) + Math.abs(py - g.py)
    g.px = px; g.py = py; g.t = now
    setNear(stopNear(px, py))
  }
  const up = (e: PointerEvent) => {
    const g = grab.current
    if (!g) return
    grab.current = null
    setNear(null)
    const b = bodies.current.get(g.i)
    if (!b) return
    b.held = false
    b.va = b.vx * 0.4
    const box = area.current!.getBoundingClientRect()
    const target = stopNear(e.clientX - box.left, e.clientY - box.top)
    if (target !== null) dock(g.i, target)
    else if (g.moved < 6) dock(g.i, slotsRef.current.indexOf(null)) // a tap places it in the next free stop
    kick.current()
  }

  const reset = () => {
    const placed = slots.filter((c): c is number => c !== null)
    setVisitor(null)
    setDone(false)
    placed.forEach((c, k) => setTimeout(() => undock(c), k * 90))
  }
  const tidyForMe = () => {
    const loose = steps.map((_, i) => i).filter((i) => !slots.includes(i))
    loose.forEach((c, k) => setTimeout(() => {
      const free = slotsRef.current.indexOf(null)
      if (free >= 0) dock(c, free)
    }, k * 140))
  }

  const verdict = visitor && compareOrder(visitor)
  const card = (i: number, placed: boolean) => {
    const pos = visitor ? visitor.indexOf(i) + 1 : null
    return (
      <button
        key={i}
        ref={(el) => {
          cards.current[i] = el
        }}
        type="button"
        style={{ viewTransitionName: `tidy-card-${i}` } as CSSProperties}
        onPointerDown={placed ? undefined : (e) => down(e, i)}
        onPointerMove={placed ? undefined : move}
        onPointerUp={placed ? undefined : up}
        // keyboard: Enter/Space places a loose card in the next free stop; on a placed card it throws it back
        onClick={(e) => {
          if (done) return
          if (placed) undock(i)
          else if (e.detail === 0) dock(i, slots.indexOf(null))
        }}
        aria-label={steps[i]}
        className={`tidy-card display-font touch-none select-none text-left ${placed ? 'w-full' : 'is-loose'} ${done ? '' : 'cursor-grab'}`}
      >
        {done && <span className="mb-2 block font-sans text-sm text-[var(--orange)]">{i + 1}</span>}
        {steps[i]}
        {pos !== null && <span className="mt-3 block text-sm font-normal tracking-normal text-[var(--soft)]">{t.yourPos}: {pos}</span>}
      </button>
    )
  }

  return (
    <div className="select-none" onPointerMove={move}>
      <div ref={area} className={`toss ${done ? 'is-done' : ''}`}>
        {steps.map((_, i) => (slots.includes(i) ? null : card(i, false)))}
      </div>

      {/* the stops are dots on a line; it fills in orange as cards land */}
      <div className={`tidy-path ${done ? 'is-done' : ''}`} style={{ '--filled': slots.filter((c) => c !== null).length / slots.length } as CSSProperties}>
        <div className="tidy-line" aria-hidden><span /></div>
        <ol className="tidy-stops">
          {slots.map((c, s) => (
            <li
              key={s}
              ref={(el) => {
                stops.current[s] = el
              }}
              className={`tidy-stop ${c === null ? 'is-empty' : 'is-full'} ${near === s ? 'is-near' : ''}`}
            >
              <span className="tidy-dot">{s + 1}</span>
              {c === null ? <span className="tidy-hint">{t.dropHere}</span> : card(c, true)}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4" aria-live="polite">
        <p className="max-w-[46ch] text-[clamp(1.15rem,1.8vw,1.45rem)] leading-snug">
          {done && !verdict && t.mine}
          {verdict && (
            <>
              {verdict.sameStart
                ? t.sameStart.replace('{step}', steps[0])
                : t.diffStart.replace('{yours}', steps[verdict.first]).replace('{mine}', steps[0])}{' '}
              <span className="text-[var(--soft)]">{t.matches.replace('{n}', String(verdict.matches))}</span>
            </>
          )}
        </p>
        <button type="button" onClick={done ? reset : tidyForMe} className="link text-[var(--soft)]">
          {done ? t.again : t.tidyForMe}
        </button>
      </div>
    </div>
  )
}
