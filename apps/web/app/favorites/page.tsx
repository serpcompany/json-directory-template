import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { Heart } from 'lucide-react'
import type { Metadata } from 'next'
import { getHomePageData } from '@/actions/get-home-page-data'
import { JsonLd } from '@/components/json-ld'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section'
import { NewsletterSection } from '@/components/sections/newsletter-section'
import { WebsitesListWithSearch } from '@/components/websites-list-with-search'
import { getActiveCategories } from '@/lib/category-navigation'
import { getGuides } from '@/lib/content-loader'
import { requireRouteFeature } from '@/lib/route-feature-gates'
import { SITE_NAME, SITE_PUBLIC_URL, generateBaseMetadata } from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'

export const metadata: Metadata = generateBaseMetadata({
  title: `Saved Favorites - ${SITE_NAME}`,
  description: `View and manage the ${siteCopy.listingName.plural} and related resources you have saved from the directory.`,
  keywords: ['favorites', `saved ${siteCopy.listingName.plural}`, 'bookmarks', 'directory listings', 'resources'],
  path: '/favorites'
})

export default async function FavoritesPage() {
  requireRouteFeature('showFavorites')

  const { allProjects, featuredProjects, totalCount } = await getHomePageData()
  const featuredGuides = await getGuides()
  const activeCategories = getActiveCategories(allProjects)
  const activeCategorySlugs = activeCategories.map(category => category.slug)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Favorites - ${SITE_NAME}`,
          description: `Your saved ${siteCopy.listingName.plural}`,
          url: `${SITE_PUBLIC_URL}/favorites`
        }}
      />

      <div className="border-t">
        <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
          <AppSidebar
            availableCategorySlugs={activeCategorySlugs}
            featuredCount={featuredProjects.length}
          />

          {/* Main Content */}
          <div className="relative flex h-full w-full flex-col gap-3 px-6 pt-6 pb-16">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[{ name: 'Favorites', href: '/favorites' }]}
              baseUrl={SITE_PUBLIC_URL}
            />

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                <h1 className="text-3xl font-bold">Saved Favorites</h1>
              </div>
              <p className="text-muted-foreground">
                Your saved {siteCopy.listingName.plural} and related resources from the directory
              </p>
            </div>

            {/* Favorites List with Search and Filters */}
            <WebsitesListWithSearch
              initialWebsites={allProjects}
              initialShowFavoritesOnly={true}
              totalCount={totalCount}
            />

            {/* Additional Sections */}
            <div className="mt-12 space-y-8">
              <FeaturedGuidesSection guides={featuredGuides} />
              <NewsletterSection />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
