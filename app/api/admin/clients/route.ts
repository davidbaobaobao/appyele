import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/is-admin'

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  // 1. Verify the caller is an admin via session cookie
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Use service role client (server-side only) to bypass RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: clients, error: clientsError } = await adminClient
    .from('clients')
    .select('id, business_name, city, industry_type, plan, status, created_at, website_url')
    .order('created_at', { ascending: false })

  if (clientsError) {
    console.error('admin clients fetch:', JSON.stringify(clientsError))
    return NextResponse.json({ error: clientsError.message }, { status: 500 })
  }

  const { data: unreadRows, error: unreadError } = await adminClient
    .from('messages')
    .select('client_id')
    .eq('author_role', 'client')
    .eq('read', false)

  if (unreadError) {
    console.error('admin unread fetch:', JSON.stringify(unreadError))
  }

  const unreadMap: Record<string, number> = {}
  for (const row of unreadRows ?? []) {
    unreadMap[row.client_id] = (unreadMap[row.client_id] ?? 0) + 1
  }

  const result = (clients ?? []).map((c) => ({
    ...c,
    unread_count: unreadMap[c.id] ?? 0,
  }))

  return NextResponse.json(result)
}
