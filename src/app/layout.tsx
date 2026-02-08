import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rael School - Information System',
  description: 'Information system for Rael School in Kenya',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-[#fafaf8]">
        {children}
      </body>
    </html>
  )
}
