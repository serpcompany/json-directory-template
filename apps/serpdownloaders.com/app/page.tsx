import { getHomePageData } from '../../web/actions/get-home-page-data'
import { JsonLd } from '../../web/components/json-ld'
import { AppSidebar } from '../../web/components/layout/app-sidebar'
import { CreatorProjectsSection } from '../../web/components/sections/creator-projects-section'
import { ExternalResourcesSection } from '../../web/components/sections/external-resources-section'
import { FeaturedGuidesSection } from '../../web/components/sections/featured-guides-section'
import { FeaturedProjectsSection } from '../../web/components/sections/featured-projects-section'
import { HeroSection } from '../../web/components/sections/hero-section'
import { NewsletterSection } from '../../web/components/sections/newsletter-section'
import { RecentlyAddedSection } from '../../web/components/sections/recently-added-section'
import { StaticWebsitesList } from '../../web/components/static-websites-list'
import { HomePageRoute, homePageMetadata } from '@thedaviddias/web-core/home-page'

export const metadata = homePageMetadata

export default async function Home() {
  return (
    <HomePageRoute
      data={await getHomePageData()}
      slots={{
        AppSidebar,
        CreatorProjectsSection,
        ExternalResourcesSection,
        FeaturedGuidesSection,
        FeaturedProjectsSection,
        HeroSection,
        JsonLd,
        NewsletterSection,
        RecentlyAddedSection,
        StaticWebsitesList,
      }}
    />
  )
}
