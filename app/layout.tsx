import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'X Warmup Dashboard',
  description: 'Activity tracking for X warmup accounts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
