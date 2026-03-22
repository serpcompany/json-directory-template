import type { ReactNode } from 'react'
import '../../../packages/design-system/styles/globals.css'
import { fonts } from '@thedaviddias/design-system/lib/fonts'
import { DesignSystemProvider } from '@thedaviddias/design-system/theme-provider'
import { getBaseUrl } from '@thedaviddias/utils/get-base-url'
import {
  GoogleTagManagerNoScript,
  GoogleTagManagerScript
} from '@/components/analytics/google-tag-manager'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { BackToTop } from '@/components/ui/back-to-top'
import { FavoritesProvider } from '@/contexts/favorites-context'

export const metadata: import('next').Metadata = {
  title: {
    default: 'llms.txt Hub - Directory of AI-Ready Documentation',
    template: '%s | llms.txt Hub'
  },
  description:
    'The largest directory of websites implementing the llms.txt standard. Find AI-ready documentation, browse llms.txt examples, and learn how to create your own llms.txt file.',
  metadataBase: new URL(getBaseUrl())
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleTagManagerScript gtmId={gtmId} />
        <link
          rel="alternate"
          type="application/feed+json"
          title="llms.txt Hub - New Websites"
          href="/rss.xml"
        />
      </head>
      <body className={fonts}>
        <GoogleTagManagerNoScript gtmId={gtmId} />
        <DesignSystemProvider>
          <FavoritesProvider>
            <AnalyticsTracker />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
            </div>
            <BackToTop />
          </FavoritesProvider>
        </DesignSystemProvider>
      </body>
    </html>
  )
}
