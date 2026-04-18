import type { Metadata } from 'next'
import { getHomePageData } from '@/actions/get-home-page-data'
import { JsonLd } from '@/components/json-ld'
import { CreatorProjectsSection } from '@/components/sections/creator-projects-section'
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section'
import { FeaturedProjectsSection } from '@/components/sections/featured-projects-section'
import { RecentlyAddedSection } from '@/components/sections/recently-added-section'
import { ExternalResourcesSection } from '@/components/sections/external-resources-section'
import { StaticWebsitesList } from '@/components/static-websites-list'
import { HomePageRoute, homePageMetadata } from '@thedaviddias/web-core/home-page'

export const metadata: Metadata = homePageMetadata

export default async function Home() {
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
