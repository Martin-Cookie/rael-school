import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!['ADMIN', 'MANAGER'].includes(user.role)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Sidebar user={user} />
      <main className="lg:ml-48 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
