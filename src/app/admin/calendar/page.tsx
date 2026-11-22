import { eventDay, eventTime, listEvents, type CalEvent } from '@/lib/gcal'
import { requireOwner, today, TZ } from '@/lib/owner'
import { addEvent, removeEvent } from '../actions'

const DAYS = 14

export default async function Calendar() {
  const db = await requireOwner()
  const days = Array.from({ length: DAYS }, (_, i) => today(i))
  let events: CalEvent[] | null = null
  let failure: string | null = null
  try {
    events = await listEvents(db, days[0], days.at(-1)!)
  } catch (e) {
    failure = (e as Error).message
  }

  return (
    <div className="grid gap-10">
      <h1 className="text-5xl font-semibold tracking-tight">Kalender</h1>

      <form action={addEvent} className="grid gap-3 bg-surface p-4 sm:grid-cols-[1fr_10rem_7rem_7rem_auto] sm:items-end">
        <label className="grid gap-1"><span className="note">Acara</span><input name="summary" className="field" required /></label>
        <label className="grid gap-1"><span className="note">Tanggal</span><input type="date" name="date" defaultValue={days[0]} className="field" required /></label>
        <label className="grid gap-1"><span className="note">Mulai</span><input type="time" name="start" className="field" /></label>
        <label className="grid gap-1"><span className="note">Selesai</span><input type="time" name="end" className="field" /></label>
        <button className="btn" disabled={!events}>Tambah</button>
        <p className="note sm:col-span-5">Kosongkan jam untuk acara sepanjang hari. Masuk ke Google Calendar utama Anda.</p>
      </form>

      {failure && <p role="alert" className="text-accent">{failure}</p>}
      {!failure && !events && <p className="bg-surface p-4">Kalender belum terhubung. Keluar lalu masuk lagi dengan Google untuk memberi akses kalender.</p>}

      {events && (
        <div className="grid gap-6">
          {days.map((day) => {
            const list = events.filter((e) => eventDay(e) === day)
            const label = new Date(`${day}T12:00:00Z`).toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
            return (
              <section key={day} className="grid gap-2 sm:grid-cols-[14rem_1fr]">
                <h2 className={`capitalize ${day === days[0] ? 'font-semibold' : ''}`}>{label}</h2>
                {list.length ? (
                  <ul>
                    {list.map((e) => (
                      <li key={e.id} className="flex items-baseline gap-3 border-t border-ink/20 py-1.5">
                        <span className="note w-28 shrink-0">{eventTime(e)}</span>
                        <a href={e.htmlLink} target="_blank" rel="noreferrer" className="lift flex-1">{e.summary ?? '(tanpa judul)'}</a>
                        <form action={removeEvent}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="note lift" aria-label={`Hapus ${e.summary ?? 'acara'}`}>hapus</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">—</p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false
