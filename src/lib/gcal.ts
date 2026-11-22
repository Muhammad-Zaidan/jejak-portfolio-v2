// Google Calendar over plain REST. Google stays the source of truth; nothing is copied to our DB.
import { decrypt } from './crypto'
import { TZ, type Db } from './owner'

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export type CalEvent = {
  id: string
  summary?: string
  htmlLink: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

async function accessToken(db: Db): Promise<string | null> {
  const { data } = await db.from('integrations').select('refresh_token_enc').eq('provider', 'google').maybeSingle()
  if (!data) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: decrypt(data.refresh_token_enc),
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status}). Sign in again to reconnect the calendar.`)
  return (await res.json()).access_token
}

async function call(db: Db, path: string, init?: RequestInit) {
  const token = await accessToken(db)
  if (!token) return null
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${await res.text()}`)
  return res.status === 204 ? {} : res.json()
}

/** Events between two YYYY-MM-DD days (inclusive), or null when the calendar is not connected. */
export async function listEvents(db: Db, from: string, to: string): Promise<CalEvent[] | null> {
  const q = new URLSearchParams({
    timeMin: new Date(`${from}T00:00:00+07:00`).toISOString(),
    timeMax: new Date(`${to}T23:59:59+07:00`).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    timeZone: TZ,
    maxResults: '100',
  })
  // shortcut: day bounds use +07:00 (WIB); change if TIMEZONE moves away from Jakarta.
  const data = await call(db, `?${q}`)
  return data ? data.items : null
}

export async function createEvent(db: Db, e: { summary: string; date: string; start?: string; end?: string }) {
  const body = e.start
    ? {
        summary: e.summary,
        start: { dateTime: `${e.date}T${e.start}:00`, timeZone: TZ },
        end: { dateTime: `${e.date}T${e.end || e.start}:00`, timeZone: TZ },
      }
    : { summary: e.summary, start: { date: e.date }, end: { date: e.date } }
  return call(db, '', { method: 'POST', body: JSON.stringify(body) })
}

export const deleteEvent = (db: Db, id: string) => call(db, `/${encodeURIComponent(id)}`, { method: 'DELETE' })

/** Day key (YYYY-MM-DD) and a short time label for display. */
export function eventDay(e: CalEvent) {
  return e.start.date ?? new Date(e.start.dateTime!).toLocaleDateString('en-CA', { timeZone: TZ })
}
export function eventTime(e: CalEvent) {
  if (!e.start.dateTime) return 'Sepanjang hari'
  const f = (s: string) => new Date(s).toLocaleTimeString('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
  return `${f(e.start.dateTime)}–${f(e.end.dateTime ?? e.start.dateTime)}`
}
