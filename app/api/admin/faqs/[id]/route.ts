import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { revalidateYeleSite } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'info@yele.design'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
            catch { /* session refresh cookie writes are best-effort in route handlers */ }
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    await revalidateYeleSite('/')
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('Route handler error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
