import type { ReactElement, ReactNode } from 'react'
import './globals.css'
import { fonts } from '@thedaviddias/design-system/lib/fonts'
import { SignOutButton } from '../components/auth/sign-out-button'
import { Footer } from '@thedaviddias/web-core/layout/footer'
import { Header } from '@thedaviddias/web-core/layout/header'
import { getHeaderAuthState } from '../lib/auth'
import { getActiveCategories, getFeaturedListingCount } from '@thedaviddias/web-core/category-navigation'
import { getWebsites } from '../lib/content-loader'
import { resolveGoogleTagManagerId } from '@thedaviddias/web-core/google-tag-manager'
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
          desktopSignOutButton={
            <SignOutButton className="hidden sm:inline-flex rounded-none text-sm font-bold h-9 px-4" />
          }
          featuredCount={featuredCount}
          mobileSignOutButton={
            <SignOutButton className="w-full justify-start rounded-md px-2 py-1.5 text-sm font-normal" />
          }
        />
      }
    >
      {children}
    </RootAppShell>
  )
}
