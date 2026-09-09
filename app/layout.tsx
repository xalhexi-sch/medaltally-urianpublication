import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Medal Tally — 125th University Days',
  description:
    'Live medal tally leaderboard for the 125th University Days. Track gold, silver, and bronze medals across all colleges in real time.',
  generator: 'v0.app',
  metadataBase: new URL('https://medaltally.urianpublication.com'),
  openGraph: {
    title: 'Medal Tally — 125th University Days',
    description:
      'Live medal tally leaderboard for the 125th University Days.',
    url: 'https://medaltally.urianpublication.com',
    siteName: 'Medal Tally',
    type: 'website',
    locale: 'en_PH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medal Tally — 125th University Days',
    description:
      'Live medal tally leaderboard for the 125th University Days.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#080b12',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
