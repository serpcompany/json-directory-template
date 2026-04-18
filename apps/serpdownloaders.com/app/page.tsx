import { getHomePageData } from '../actions/get-home-page-data'
import { JsonLd } from '../components/json-ld'
import { CreatorProjectsSection } from '../components/sections/creator-projects-section'
import { ExternalResourcesSection } from '../components/sections/external-resources-section'
import { FeaturedGuidesSection } from '../components/sections/featured-guides-section'
import { FeaturedProjectsSection } from '../components/sections/featured-projects-section'
import { HeroSection } from '../components/sections/hero-section'
import { RecentlyAddedSection } from '../components/sections/recently-added-section'
import { StaticWebsitesList } from '../components/static-websites-list'
import { HomePageRoute, homePageMetadata } from '@thedaviddias/web-core/home-page'

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
        HeroSection,
        JsonLd,
        RecentlyAddedSection,
        StaticWebsitesList,
      }}
    />
  )
}
