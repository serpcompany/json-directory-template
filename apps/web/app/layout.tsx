import type { ReactElement, ReactNode } from 'react'
import '../../../packages/design-system/styles/globals.css'
import { fonts } from '@thedaviddias/design-system/lib/fonts'
import { DesignSystemProvider } from '@thedaviddias/design-system/theme-provider'
import {
  GoogleTagManagerNoScript,
  GoogleTagManagerScript
} from '@/components/analytics/google-tag-manager'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { BackToTop } from '@/components/ui/back-to-top'
import { FavoritesProvider } from '@/contexts/favorites-context'
import { getHeaderAuthState } from '@/lib/auth'
import {
  SITE_APPLE_TOUCH_ICON_URL,
  SITE_DESCRIPTION,
  SITE_FAVICON_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL
} from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'

export const metadata: import('next').Metadata = {
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: SITE_FAVICON_URL,
    apple: SITE_APPLE_TOUCH_ICON_URL
  }
}

type RootLayoutProps = {
  children: ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps): Promise<ReactElement> {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const authState = await getHeaderAuthState()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleTagManagerScript gtmId={gtmId} />
        <link
          rel="alternate"
          type="application/feed+json"
          title={`${SITE_NAME} - New ${siteCopy.listingName.pluralTitle}`}
          href="/rss.xml"
        />
      </head>
      <body className={fonts}>
        <GoogleTagManagerNoScript gtmId={gtmId} />
        <DesignSystemProvider>
          <FavoritesProvider>
            <AnalyticsTracker />
            <div className="flex min-h-screen flex-col">
              <Header authState={authState} />
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
