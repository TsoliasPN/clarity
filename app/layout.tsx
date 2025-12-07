import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CLARITY - Subscription HQ',
  description: 'AI-powered, multi-currency subscription management and analytics'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
