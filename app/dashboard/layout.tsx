import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        {children}
      </main>
    </div>
  )
}
