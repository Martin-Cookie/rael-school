import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function PaymentsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!['ADMIN', 'MANAGER'].includes(user.role)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Sidebar user={user} />
      <main className="lg:ml-48 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  )
}
