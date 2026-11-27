'use client'
import { useSyncExternalStore } from 'react'

const KEY = 'theme'
// Runs before first paint: a saved choice wins over the system setting, so there is no flash of the wrong theme.
const BOOT = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />
}

const current = () =>
  (document.documentElement.dataset.theme as 'light' | 'dark' | undefined) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
const subscribe = (cb: () => void) => {
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  addEventListener('themechange', cb)
  return () => {
    mq.removeEventListener('change', cb)
    removeEventListener('themechange', cb)
  }
}

/** Sun/moon switch. The choice is kept on this device; until one is made, the system setting decides. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, current, () => 'dark' as const)
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      aria-label={next === 'light' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={next === 'light' ? 'Mode terang' : 'Mode gelap'}
      onClick={() => {
        document.documentElement.dataset.theme = next
        try {
          localStorage.setItem(KEY, next)
        } catch {}
        dispatchEvent(new Event('themechange'))
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
        {theme === 'dark' ? (
          <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  )
}
