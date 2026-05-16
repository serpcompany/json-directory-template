import type { Metadata } from 'next'
import { getHomePageData } from '@/actions/get-home-page-data'
import { HomePageRoute } from '@thedaviddias/web-core/home-page'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { getRoute } from '@thedaviddias/web-core/routes'
import { CreatorProjectsSectionRoute as CreatorProjectsSection } from '@thedaviddias/web-core/sections/creator-projects-section-route'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'
import { FeaturedGuidesSectionRoute as FeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section-route'
import { FeaturedProjectsSectionRoute as FeaturedProjectsSection } from '@thedaviddias/web-core/sections/featured-projects-section-route'
import { RecentlyAddedSectionRoute as RecentlyAddedSection } from '@thedaviddias/web-core/sections/recently-added-section-route'
import { StaticWebsitesListRoute as StaticWebsitesList } from '@thedaviddias/web-core/sections/static-websites-list-route'
import { SITE_NAME, SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'

export const metadata: Metadata = {
  title: `Products - ${SITE_NAME}`,
  description: 'Discover a curated list of SERP products, software, AI tools, companies, and resources.',
  alternates: {
    canonical: `${SITE_PUBLIC_URL}${getRoute('listing.list')}`
  }
}

export default async function ProductsPage() {
  return (
    <HomePageRoute
      data={await getHomePageData()}
      slots={{
        CreatorProjectsSection,
        ExternalResourcesSection,
        FeaturedGuidesSection,
        FeaturedProjectsSection,
        JsonLd,
        RecentlyAddedSection,
        StaticWebsitesList,
      }}
    />
  )
}
