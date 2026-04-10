import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { isAdmin } from '@/lib/is-admin'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = { title: 'Admin — Vitrina Studio' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!isAdmin(user.email)) redirect('/dashboard')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0F1923' }}>
      <AdminSidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        {children}
      </main>
    </div>
  )
}
