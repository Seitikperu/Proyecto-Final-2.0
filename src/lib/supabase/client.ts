import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: typeof window !== 'undefined' ? window.location.hostname : '',
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  )
}

let _client: ReturnType<typeof createClient> | null = null
export function getSupabaseClient() {
  if (!_client) _client = createClient()
  return _client
}
