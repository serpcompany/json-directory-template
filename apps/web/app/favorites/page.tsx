import { getHomePageData } from '@/actions/get-home-page-data'
import { JsonLd } from '@/components/json-ld'
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section'
import { WebsitesListWithSearch } from '@/components/websites-list-with-search'
import { getGuides } from '@/lib/content-loader'
import {
  FavoritesIndexPage,
  favoritesPageMetadata,
} from '@thedaviddias/web-core/favorites/index-page'
import { requireRouteFeature } from '@/lib/route-feature-gates'
import type { Metadata } from 'next'

export const metadata: Metadata = favoritesPageMetadata

export default async function FavoritesPage() {
  requireRouteFeature('showFavorites')

  const { allProjects, featuredProjects, totalCount } = await getHomePageData()
  const featuredGuides = await getGuides()

  return (
    <FavoritesIndexPage
      allProjects={allProjects}
      featuredGuides={featuredGuides}
      featuredProjects={featuredProjects}
      totalCount={totalCount}
      slots={{
        FeaturedGuidesSection,
        JsonLd,
        WebsitesListWithSearch,
      }}
    />
  )
}
