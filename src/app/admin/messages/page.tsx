import { requireOwner } from '@/lib/owner'
import { deleteMessage } from '../actions'

export default async function Messages() {
  const db = await requireOwner()
  const { data, error } = await db.from('messages').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (
    <div>
      <h1 className="text-5xl font-semibold tracking-tight">Pesan</h1>
      <ul className="mt-6 grid gap-6">
        {data.map((m) => (
          <li key={m.id} className="border-t border-ink pt-3">
            <p className="note">{new Date(m.created_at).toLocaleString('id-ID')} · {m.name} · <a className="lift" href={`mailto:${m.email}`}>{m.email}</a></p>
            <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
            <form action={deleteMessage} className="mt-2">
              <input type="hidden" name="id" value={m.id} />
              <button className="note lift">hapus</button>
            </form>
          </li>
        ))}
      </ul>
      {data.length === 0 && <p className="mt-6 text-muted">Belum ada pesan.</p>}
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false
