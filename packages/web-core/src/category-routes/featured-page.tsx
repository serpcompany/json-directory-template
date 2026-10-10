import type { Metadata } from 'next'
import type { ComponentType, ReactNode } from 'react'
import {
  type GuideMetadata,
  toWebsiteBrowseCardMetadata,
  type WebsiteBrowseCardMetadata,
  type WebsiteMetadata
} from '../content-query'
import { AppSidebar } from '../layout/app-sidebar'
import { getFeaturedCategoryRoute } from '../routes'
import { NewsletterSection } from '../sections/newsletter-section'
import { generateBaseMetadata, SITE_NAME, SITE_PUBLIC_URL } from '../seo-config'
import { siteConfig } from '../site-config'
import { siteCopy } from '../site-copy'
import { buildListingCollectionPageSchema } from './collection-page-schema'
import { resolveCollectionPageSchemaDates } from './schema-dates'

type JsonLdProps = {
  data: Record<string, unknown>
}

type CategoryWebsitesListProps = {
  initialWebsites: WebsiteBrowseCardMetadata[]
}

type FeaturedGuidesSectionProps = {
  guides: GuideMetadata[]
}

type FeaturedCategorySlots = {
  CategoryWebsitesList: ComponentType<CategoryWebsitesListProps>
  ExternalResourcesSection: ComponentType
  FeaturedGuidesSection: ComponentType<FeaturedGuidesSectionProps>
  JsonLd: (props: JsonLdProps) => ReactNode | Promise<ReactNode>
  breadcrumb: ReactNode
  headingIcon: ReactNode
}

export const featuredCategoryPageMetadata: Metadata = generateBaseMetadata({
  // The root layout appends ` | <site name>`.
  title: `Featured ${siteCopy.listingName.pluralTitle}`,
  description: `Discover our curated selection of featured ${siteCopy.listingName.plural} and related resources.`,
  keywords: [
    'featured',
    'curated',
    `featured ${siteCopy.listingName.plural}`,
    'directory',
    'resources'
  ],
  path: getFeaturedCategoryRoute()
})

export function FeaturedCategoryRoutePage({
  activeCategorySlugs,
  featuredGuides,
  featuredProjects,
  slots
}: {
  activeCategorySlugs: string[]
  featuredGuides: GuideMetadata[]
  featuredProjects: WebsiteMetadata[]
  slots: FeaturedCategorySlots
}) {
  const {
    CategoryWebsitesList,
    ExternalResourcesSection,
    FeaturedGuidesSection,
    JsonLd,
    breadcrumb,
    headingIcon
  } = slots
  const featuredPath = getFeaturedCategoryRoute()
  const featuredUrl = `${SITE_PUBLIC_URL}${featuredPath}`
  const featuredProjectCards = featuredProjects.map(toWebsiteBrowseCardMetadata)
  const schemaDates = resolveCollectionPageSchemaDates(featuredProjects)

  return (
    <>
      <JsonLd
        data={buildListingCollectionPageSchema({
          dates: schemaDates,
          description: `Explore ${featuredProjects.length}+ curated featured ${siteCopy.listingName.plural} from ${SITE_NAME}. Hand-picked for quality and relevance.`,
          headline: `${featuredProjects.length}+ Featured ${siteCopy.listingName.pluralTitle}`,
          itemListDescription: `Curated selection of featured ${siteCopy.listingName.plural} and resources`,
          itemListName: `Featured ${siteCopy.listingName.pluralTitle}`,
          listings: featuredProjects,
          name: `Featured - ${SITE_NAME}`,
          url: featuredUrl
        })}
      />

      <div className="border-t">
        <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
          <AppSidebar
            availableCategorySlugs={activeCategorySlugs}
            featuredCount={featuredProjects.length}
          />

          <div className="relative flex h-full w-full flex-col gap-3 px-6 pt-6">
            {breadcrumb}

            <section className="space-y-6">
              <div className="sticky top-16 z-35 bg-background border-b py-4 -mx-6 px-6">
                <div className="flex items-center gap-3">
                  {headingIcon}
                  <h1 className="text-2xl font-bold">
                    Featured {siteCopy.listingName.pluralTitle}
                  </h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Curated listings highlighted for quality, usefulness, and relevance
                </p>
              </div>
              <CategoryWebsitesList initialWebsites={featuredProjectCards} />
            </section>

            {siteConfig.features.showExternalResources && <ExternalResourcesSection />}
            {siteConfig.features.showFeaturedGuides && (
              <FeaturedGuidesSection guides={featuredGuides} />
            )}
            {siteConfig.features.showNewsletter && <NewsletterSection />}
          </div>
        </div>
      </div>
    </>
  )
}
