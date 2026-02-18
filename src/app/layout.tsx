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
    <html lang="cs" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('rael-theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-[#fafaf8]">
        {children}
      </body>
    </html>
  )
}
