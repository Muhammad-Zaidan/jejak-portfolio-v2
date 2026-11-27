import { cookies, headers } from 'next/headers'
import type { Db } from './owner'

export const DEVICE_COOKIE = 'os_device'

/** "Chrome di Windows", "Safari di iPhone": enough to recognise a device in a list. */
export function deviceName(ua: string) {
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'perangkat lain'
  const app = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  return `${app} di ${os}`
}

/** Notes a sign-in with this request's device cookie, browser and address. Never blocks the sign-in itself. */
export async function recordSignIn(db: Db, method: 'passkey' | 'email' | 'google') {
  const [c, h] = await Promise.all([cookies(), headers()])
  const device = c.get(DEVICE_COOKIE)?.value
  if (!device) return
  const { error } = await db.from('sign_ins').insert({
    device,
    method,
    user_agent: (h.get('user-agent') ?? '').slice(0, 400),
    ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 64),
  })
  if (error) console.error('recording sign-in failed:', error.message)
}
