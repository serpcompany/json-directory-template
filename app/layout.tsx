import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  weight: ['400', '500', '600', '700']
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500']
})

export const metadata: Metadata = {
  title: {
    default: 'llms.txt Hub - Directory of AI-Ready Documentation',
    template: '%s | llms.txt Hub'
  },
  description:
    'The largest directory of AI-ready documentation patterns and llms.txt examples, rebuilt as a static standalone app.',
  metadataBase: new URL('https://example.com')
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} bg-background text-foreground antialiased`}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}