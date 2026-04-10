import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/is-admin'

async function authorize(cookieStore: Awaited<ReturnType<typeof cookies>>) {
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
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { user, adminClient }
}

// GET /api/admin/messages?clientId=xxx
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const cookieStore = await cookies()
  const { user, adminClient } = await authorize(cookieStore)

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminClient
    .from('messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('admin messages fetch:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// POST /api/admin/messages — send a studio message
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const { user, adminClient } = await authorize(cookieStore)

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, body } = await req.json()
  if (!clientId || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { error: insertError } = await adminClient
    .from('messages')
    .insert({ client_id: clientId, author_role: 'studio', body, read: false })

  if (insertError) {
    console.error('admin message insert:', JSON.stringify(insertError))
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Mark all unread client messages as read
  await adminClient
    .from('messages')
    .update({ read: true })
    .eq('client_id', clientId)
    .eq('author_role', 'client')
    .eq('read', false)

  return NextResponse.json({ ok: true })
}

// PATCH /api/admin/messages — mark client messages read
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const { user, adminClient } = await authorize(cookieStore)

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId } = await req.json()
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  await adminClient
    .from('messages')
    .update({ read: true })
    .eq('client_id', clientId)
    .eq('author_role', 'client')
    .eq('read', false)

  return NextResponse.json({ ok: true })
}
