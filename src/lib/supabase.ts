import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const configured = Boolean(url && anonKey)

// Visitor client: no cookies, so it can live inside 'use cache'. RLS limits it to public rows.
export function publicDb() {
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

// Request client: carries the signed-in owner's session.
export async function sessionDb() {
  const store = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // called from a Server Component: the proxy refreshes the session instead
        }
      },
    },
  })
}
