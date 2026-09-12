import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Final Medal Tally — 125th University Days',
  description:
    'Official final medal tally leaderboard for the 125th University Days. Final results across all colleges.',
  generator: 'v0.app',
  metadataBase: new URL('https://medaltally.urianpublication.com'),
  openGraph: {
    title: 'Final Medal Tally — 125th University Days',
    description:
      'Official final medal tally leaderboard for the 125th University Days.',
    url: 'https://medaltally.urianpublication.com',
    siteName: 'Medal Tally',
    images: [
      {
        url: '/udays-125-header.png',
        width: 1200,
        height: 630,
        alt: '125th University Days Medal Tally — Urian Publication',
      },
    ],
    type: 'website',
    locale: 'en_PH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medal Tally — 125th University Days',
    description:
      'Live medal tally leaderboard for the 125th University Days.',
    images: ['/udays-125-header.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/urian-pub-logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/urian-pub-logo.png',
    apple: '/urian-pub-logo.png',
  },
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
