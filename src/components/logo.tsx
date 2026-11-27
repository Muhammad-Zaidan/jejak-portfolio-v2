import type { CSSProperties } from 'react'

// The JEJAK wordmark is public/brand/jejak-word.png (1200×333, letters in these columns); it is drawn in the current
// text colour through a mask. The logogram is the wordmark's own J with the orange dot: the mark left behind.
const LETTERS: [number, number][] = [[0, 146], [181, 346], [368, 514], [535, 781], [798, 1009]]
const W = 1200

/** Full logo: JEJAK with the dot floating over the K. `animated` plays the intro: letters rise, then the dot lands. */
export function Logo({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <span role="img" aria-label="Jejak" className={`logo ${animated ? 'is-animated' : ''} ${className ?? ''}`}>
      {animated ? (
        LETTERS.map(([a, b], i) => (
          <span
            key={a}
            className="logo-letter"
            aria-hidden
            style={{ left: `${(a / W) * 100}%`, width: `${((b - a) / W) * 100}%`, '--size': `${(W / (b - a)) * 100}%`, '--pos': `${(a / (W - (b - a))) * 100}%`, '--i': i } as CSSProperties}
          />
        ))
      ) : (
        <span className="logo-word" aria-hidden />
      )}
      <span className="logo-dot" aria-hidden />
    </span>
  )
}

/** Just the logogram, for small spots (footer, app icon). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Jejak" className={`logo-mark ${className ?? ''}`}>
      <span className="logo-j" aria-hidden />
      <span className="logo-dot" aria-hidden />
    </span>
  )
}
