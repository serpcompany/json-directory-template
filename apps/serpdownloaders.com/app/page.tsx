import { getHomePageData } from '../actions/get-home-page-data'
import { HomePageRoute, homePageMetadata } from '@thedaviddias/web-core/home-page'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { CreatorProjectsSectionRoute as CreatorProjectsSection } from '@thedaviddias/web-core/sections/creator-projects-section-route'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'
import { FeaturedGuidesSectionRoute as FeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section-route'
import { FeaturedProjectsSectionRoute as FeaturedProjectsSection } from '@thedaviddias/web-core/sections/featured-projects-section-route'
import { RecentlyAddedSectionRoute as RecentlyAddedSection } from '@thedaviddias/web-core/sections/recently-added-section-route'
import { StaticWebsitesListRoute as StaticWebsitesList } from '@thedaviddias/web-core/sections/static-websites-list-route'

export const metadata = homePageMetadata

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
