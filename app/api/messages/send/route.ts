import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { sendNewMessageNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: client, error: clientErr } = await adminClient
    .from('clients')
    .select('id, business_name, email')
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { error: insertErr } = await adminClient
    .from('messages')
    .insert({ client_id: client.id, author_role: 'client', body: body.trim(), read: false })

  if (insertErr) {
    console.error('[messages/send] insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  // Fire-and-forget email notification — never fail the request due to email errors
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_api_key')) {
    sendNewMessageNotification({
      clientName: client.business_name,
      clientEmail: client.email ?? undefined,
      message: body.trim(),
      clientId: client.id,
    }).catch((err) => console.error('[messages/send] email error:', err))
  }

  return NextResponse.json({ ok: true })
}
