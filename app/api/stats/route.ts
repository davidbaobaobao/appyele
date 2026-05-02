import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  const { data: client } = await supabase
    .from('clients')
    .select('vercel_project_id, business_name')
    .eq('user_id', user.id)
    .single()

  if (!client?.vercel_project_id) {
    return NextResponse.json({ error: 'No project configured' }, { status: 404 })
  }

  const now = new Date()
  const from = new Date()
  if (period === '7d') from.setDate(now.getDate() - 7)
  else if (period === '30d') from.setDate(now.getDate() - 30)
  else if (period === '90d') from.setDate(now.getDate() - 90)

  const baseUrl = 'https://vercel.com/api/web/insights'
  const authHeaders = {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  }

  const params = new URLSearchParams({
    projectId: client.vercel_project_id,
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
    environment: 'production',
  })
  if (process.env.VERCEL_TEAM_ID) {
    params.set('teamId', process.env.VERCEL_TEAM_ID)
  }

  try {
    const [pageviews, visitors, topPages, devices, countries] = await Promise.all([
      fetch(`${baseUrl}/pageviews?${params}`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${baseUrl}/visitors?${params}`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${baseUrl}/pages?${params}&limit=5`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${baseUrl}/devices?${params}`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${baseUrl}/countries?${params}&limit=5`, { headers: authHeaders }).then(r => r.json()),
    ])

    return NextResponse.json({
      pageviews: pageviews?.total ?? 0,
      visitors: visitors?.total ?? 0,
      topPages: topPages?.data ?? [],
      devices: devices?.data ?? [],
      countries: countries?.data ?? [],
      period,
      businessName: client.business_name,
    })
  } catch (err) {
    console.error('Vercel Analytics fetch error:', err)
    return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 })
  }
}
