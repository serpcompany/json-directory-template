import type { ReactElement, ReactNode } from 'react'
import '../../../packages/design-system/styles/globals.css'
import { DesignSystemProvider } from '@thedaviddias/design-system/theme-provider'
import { fonts } from '@thedaviddias/design-system/lib/fonts'
import { getHeaderAuthState } from '@/lib/auth'
import { getActiveCategories, getFeaturedListingCount } from '@thedaviddias/web-core/category-navigation'
import { getWebsites } from '@/lib/content-loader'
import { resolveGoogleTagManagerId } from '@thedaviddias/web-core/google-tag-manager'
import { Footer } from '@thedaviddias/web-core/layout/footer'
import { Header } from '@thedaviddias/web-core/layout/header'
import { RootAppShell, rootLayoutMetadata } from '@thedaviddias/web-core/root-shell'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { resolveSiteConfig } from '@thedaviddias/web-core/site-config'

export const metadata = rootLayoutMetadata

type RootLayoutProps = {
  children: ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps): Promise<ReactElement> {
  const activeSiteConfig = resolveSiteConfig()
  const gtmId = resolveGoogleTagManagerId(activeSiteConfig)
  const authState = await getHeaderAuthState()
  const allListings = getWebsites()
  const activeCategories = getActiveCategories(allListings)
  const activeCategorySlugs = activeCategories.map(category => category.slug)
  const featuredCount = getFeaturedListingCount(allListings)

  return (
    <RootAppShell
      bodyClassName={fonts}
      feedTitle={`${activeSiteConfig.name} - New ${siteCopy.listingName.pluralTitle}`}
      footer={<Footer />}
      gtmId={gtmId}
      header={
        <Header
          activeCategorySlugs={activeCategorySlugs}
          authState={authState}
          featuredCount={featuredCount}
        />
      }
    >
      <DesignSystemProvider>{children}</DesignSystemProvider>
    </RootAppShell>
  )
}
