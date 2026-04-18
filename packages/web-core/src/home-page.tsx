import type { Metadata } from 'next'
import type { ComponentType, ReactElement } from 'react'
import { getActiveCategories } from './category-navigation'
import type { GuideMetadata, WebsiteMetadata } from './content-query'
import { generateBaseMetadata, generateWebsiteSchema, KEYWORDS } from './seo-config'
import { siteCopy } from './site-copy'
import { siteConfig } from './site-config'

export interface HomePageData {
  allProjects: WebsiteMetadata[]
  featuredGuides: GuideMetadata[]
  featuredProjects: WebsiteMetadata[]
  recentlyUpdatedProjects: WebsiteMetadata[]
  totalCount: number
}

interface JsonLdProps {
  data: Record<string, any>
}

interface AppSidebarProps {
  availableCategorySlugs?: string[]
  featuredCount?: number
}

interface FeaturedGuidesSectionProps {
  guides: GuideMetadata[]
}

interface FeaturedProjectsSectionProps {
  projects: WebsiteMetadata[]
}

interface RecentlyAddedSectionProps {
  websites: WebsiteMetadata[]
}

interface StaticWebsitesListProps {
  displayLimit: number
  totalCount: number
  websites: WebsiteMetadata[]
}

export interface HomePageSlots {
  AppSidebar: ComponentType<AppSidebarProps>
  CreatorProjectsSection: ComponentType
  ExternalResourcesSection: ComponentType
  FeaturedGuidesSection: ComponentType<FeaturedGuidesSectionProps>
  FeaturedProjectsSection: ComponentType<FeaturedProjectsSectionProps>
  HeroSection: ComponentType
  JsonLd: (props: JsonLdProps) => ReactElement | Promise<ReactElement>
  NewsletterSection: ComponentType
  RecentlyAddedSection: ComponentType<RecentlyAddedSectionProps>
  StaticWebsitesList: ComponentType<StaticWebsitesListProps>
}

export const homePageMetadata: Metadata = generateBaseMetadata({
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

interface HomePageRouteProps {
  data: HomePageData
  slots: HomePageSlots
}

export function HomePageRoute({ data, slots }: HomePageRouteProps): ReactElement {
  const HOMEPAGE_SECTION_LIMIT = 50
  const {
    allProjects,
    featuredGuides,
    featuredProjects,
    recentlyUpdatedProjects,
    totalCount,
  } = data
  const {
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
  } = slots

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

            <section>
              <RecentlyAddedSection websites={recentlyUpdatedProjects} />
            </section>

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
