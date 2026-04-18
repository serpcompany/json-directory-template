import type { Metadata } from 'next'
import { getHomePageData } from '@/actions/get-home-page-data'
import { JsonLd } from '@/components/json-ld'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { CreatorProjectsSection } from '@/components/sections/creator-projects-section'
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section'
import { FeaturedProjectsSection } from '@/components/sections/featured-projects-section'
import { HeroSection } from '@/components/sections/hero-section'
import { NewsletterSection } from '@/components/sections/newsletter-section'
import { RecentlyAddedSection } from '@/components/sections/recently-added-section'
import { ExternalResourcesSection } from '@/components/sections/external-resources-section'
import { StaticWebsitesList } from '@/components/static-websites-list'
import { getActiveCategories } from '@thedaviddias/web-core/category-navigation'
import { generateBaseMetadata, generateWebsiteSchema, KEYWORDS } from '@thedaviddias/web-core/seo-config'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { siteConfig } from '@thedaviddias/web-core/site-config'

export const metadata: Metadata = generateBaseMetadata({
  title: `${siteConfig.name} Directory of ${siteCopy.listingName.pluralTitle} and Resources`,
  description:
    `${siteConfig.tagline}. Browse curated ${siteCopy.listingName.plural}, resources, and documentation links in one searchable directory.`,
  keywords: [
    ...KEYWORDS.homepage,
    ...KEYWORDS.global,
    'directory listings',
    'curated resources',
    'documentation links',
    'resource directory',
    'searchable directory'
  ],
  path: '/'
})

export default async function Home() {
  const HOMEPAGE_SECTION_LIMIT = 50
  const {
    allProjects,
    featuredProjects,
    recentlyUpdatedProjects,
    totalCount,
    featuredGuides
  } = await getHomePageData()

  // Sort projects alphabetically by name server-side
  const sortedProjects = [...allProjects].sort((a, b) => a.name.localeCompare(b.name))
  const homepageProjects = sortedProjects.slice(0, HOMEPAGE_SECTION_LIMIT)
  const homepageFeaturedGuides = featuredGuides.slice(0, HOMEPAGE_SECTION_LIMIT)
  const activeCategories = getActiveCategories(allProjects)
  const activeCategorySlugs = activeCategories.map(category => category.slug)

  return (
    <>
      <JsonLd data={generateWebsiteSchema()} />
      <div className="w-full space-y-16">
        <HeroSection />
      </div>
      <div className="border-t">
        <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
          <AppSidebar
            availableCategorySlugs={activeCategorySlugs}
            featuredCount={featuredProjects.length}
          />

          <div className="relative flex h-full w-full flex-col px-6 pt-6 pb-16 space-y-8">
            <section>
              <FeaturedProjectsSection projects={featuredProjects} />
            </section>

            {/* Recently Added Section */}
            <section>
              <RecentlyAddedSection websites={recentlyUpdatedProjects} />
            </section>

            {/* All Websites Section */}
            <section>
              <StaticWebsitesList
                websites={homepageProjects}
                totalCount={totalCount}
                displayLimit={HOMEPAGE_SECTION_LIMIT}
              />
            </section>

            {siteConfig.features.showExternalResources && <ExternalResourcesSection />}
            {siteConfig.features.showFeaturedGuides && (
              <FeaturedGuidesSection guides={homepageFeaturedGuides} />
            )}
            {siteConfig.features.showCreatorProjects && <CreatorProjectsSection />}
            {siteConfig.features.showNewsletter && <NewsletterSection />}
          </div>
        </div>
      </div>
    </>
  )
}
