import type { Metadata } from 'next'
import type { ComponentType, ReactNode } from 'react'
import type { Category } from '../categories'
import { getCategoryDisplayName } from '../category-display'
import {
  type CategoryLike,
  getFeaturedListingCount,
  listingMatchesCategory
} from '../category-navigation'
import {
  getCategoryPageCount,
  getCategoryPageRoute,
  getConfiguredCategoryPageSize,
  sliceCategoryPage
} from '../category-pagination'
import {
  buildCategoryMetaDescription,
  buildCategoryMetaTitle,
  getCategorySEO
} from '../category-seo'
import {
  type GuideMetadata,
  toWebsiteBrowseCardMetadata,
  type WebsiteBrowseCardMetadata,
  type WebsiteMetadata
} from '../content-query'
import { AppSidebar } from '../layout/app-sidebar'
import { NewsletterSection } from '../sections/newsletter-section'
import { generateDynamicMetadata, SITE_NAME, SITE_PUBLIC_URL } from '../seo-config'
import { siteConfig } from '../site-config'
import { siteCopy } from '../site-copy'
import { CategoryPaginationNav } from './category-pagination-nav'
import { buildListingCollectionPageSchema } from './collection-page-schema'
import { resolveCollectionPageSchemaDates } from './schema-dates'

type JsonLdProps = {
  data: Record<string, unknown>
}

type CategoryWebsitesListProps = {
  initialWebsites: WebsiteBrowseCardMetadata[]
  summary?: string
}

type FeaturedGuidesSectionProps = {
  guides: GuideMetadata[]
}

type CategoryRouteSlots = {
  CategoryWebsitesList: ComponentType<CategoryWebsitesListProps>
  ExternalResourcesSection: ComponentType
  FeaturedGuidesSection: ComponentType<FeaturedGuidesSectionProps>
  JsonLd: (props: JsonLdProps) => ReactNode | Promise<ReactNode>
  breadcrumb: ReactNode
}

export function generateCategoryRouteStaticParams(categories: Category[]) {
  return categories.map(category => ({
    category: category.slug
  }))
}

export async function generateCategoryRouteMetadata({
  allProjects,
  category,
  page = 1
}: {
  allProjects: Array<WebsiteMetadata & CategoryLike>
  category: Category
  page?: number
}): Promise<Metadata> {
  const seoContent = getCategorySEO(category.slug, category)
  const categoryProjectsCount =
    category.slug === 'featured'
      ? allProjects.filter(project => project.featured === true).length
      : allProjects.filter(project => listingMatchesCategory(project, category.slug)).length

  const categoryName = getCategoryDisplayName(category.slug)
  const title = buildCategoryMetaTitle({
    categoryName,
    listingCount: categoryProjectsCount,
    siteName: SITE_NAME
  })
  const description = buildCategoryMetaDescription([
    categoryProjectsCount > 0
      ? `Explore ${categoryProjectsCount}+ ${categoryName.toLowerCase()} ${siteCopy.listingName.plural}`
      : `Explore ${categoryName.toLowerCase()} ${siteCopy.listingName.plural}`,
    category.description
  ])

  const metadata = generateDynamicMetadata({
    type: 'category',
    name: title,
    description,
    slug: category.slug,
    additionalKeywords: seoContent.keywords
  })

  if (page <= 1) {
    return metadata
  }

  // Later pages are self-canonical with their own title and description.
  const pageCount = getCategoryPageCount(categoryProjectsCount, getConfiguredCategoryPageSize())
  const pageUrl = `${SITE_PUBLIC_URL}${getCategoryPageRoute(category.slug, page)}`
  const pageTitle = `${buildCategoryMetaTitle({
    categoryName,
    listingCount: categoryProjectsCount,
    siteName: `${SITE_NAME} - Page ${page}`
  })} - Page ${page}`
  const pageDescription = buildCategoryMetaDescription([
    `Page ${page} of ${pageCount}`,
    ...description.split(/(?<=[.!?])\s+/)
  ])

  return {
    ...metadata,
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: pageUrl },
    openGraph: {
      ...metadata.openGraph,
      title: pageTitle,
      description: pageDescription,
      url: pageUrl
    },
    twitter: { ...metadata.twitter, title: pageTitle, description: pageDescription }
  }
}

export function CategoryRoutePage({
  activeCategorySlugs,
  allProjects,
  category,
  featuredGuides,
  featuredProjects,
  page = 1,
  slots
}: {
  activeCategorySlugs: string[]
  allProjects: Array<WebsiteMetadata & CategoryLike>
  category: Category
  featuredGuides: GuideMetadata[]
  featuredProjects: WebsiteMetadata[]
  /** 1-based category page; pages after the first exist only when `browse.categoryPageSize` is set. */
  page?: number
  slots: CategoryRouteSlots
}) {
  const {
    CategoryWebsitesList,
    ExternalResourcesSection,
    FeaturedGuidesSection,
    JsonLd,
    breadcrumb
  } = slots

  const seoContent = getCategorySEO(category.slug, category)
  const categoryDisplayName = getCategoryDisplayName(category.slug)
  const categoryPageSize = getConfiguredCategoryPageSize()
  const categoryUrl = `${SITE_PUBLIC_URL}${getCategoryPageRoute(category.slug, page)}`

  const categoryProjects =
    category.slug === 'featured'
      ? allProjects
          .filter(project => project.featured === true)
          .sort((a, b) => a.name.localeCompare(b.name))
      : allProjects
          .filter(project => listingMatchesCategory(project, category.slug))
          .sort((a, b) => a.name.localeCompare(b.name))
  const listedCategoryProjects =
    !categoryPageSize && category.slug === 'other' && categoryProjects.length > 200
      ? categoryProjects.slice(0, 200)
      : categoryProjects
  const categoryPage = sliceCategoryPage(listedCategoryProjects, page, categoryPageSize)

  if (!categoryPage) {
    return { categoryProjects: [], element: null }
  }

  const listedCategoryProjectCards = categoryPage.items.map(toWebsiteBrowseCardMetadata)
  const schemaDates = resolveCollectionPageSchemaDates(categoryProjects)
  const pageSummary =
    categoryPage.pageCount > 1
      ? `Showing ${categoryPage.startIndex + 1}-${categoryPage.startIndex + categoryPage.items.length} of ${categoryPage.totalCount} ${siteCopy.listingName.plural} in this category`
      : undefined

  return {
    categoryProjects: categoryPage.items,
    element: (
      <>
        <JsonLd
          data={buildListingCollectionPageSchema({
            dates: schemaDates,
            description: `Explore ${
              categoryProjects.length
            }+ curated ${categoryDisplayName.toLowerCase()} ${
              siteCopy.listingName.plural
            } from ${SITE_NAME}. ${category.description}`,
            headline: `${categoryProjects.length}+ ${categoryDisplayName} ${siteCopy.listingName.pluralTitle}`,
            itemListDescription: category.description,
            itemListName: `${categoryDisplayName} ${siteCopy.listingName.pluralTitle}`,
            ...(categoryPage.pageCount > 1
              ? {
                  itemLimit: categoryPage.items.length,
                  listings: categoryPage.items,
                  numberOfItems: categoryPage.totalCount,
                  positionOffset: categoryPage.startIndex
                }
              : { listings: categoryProjects }),
            name:
              page > 1
                ? `${categoryDisplayName} - Page ${page} - ${SITE_NAME}`
                : `${categoryDisplayName} - ${SITE_NAME}`,
            url: categoryUrl
          })}
        />
        {seoContent.faqQuestions && seoContent.faqQuestions.length > 0 && (
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: seoContent.faqQuestions.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer
                }
              }))
            }}
          />
        )}
        <div className="border-t">
          <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
            <AppSidebar
              availableCategorySlugs={activeCategorySlugs}
              currentCategory={category.slug}
              featuredCount={getFeaturedListingCount(featuredProjects)}
            />

            <div className="relative flex h-full w-full flex-col gap-3 px-6 pt-6">
              {breadcrumb}

              <section className="space-y-6">
                <div className="sticky top-16 z-35 bg-background border-b py-4 -mx-6 px-6">
                  <div className="flex items-center gap-3">
                    <category.icon className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">{seoContent.h1Title}</h1>
                  </div>
                  <p className="text-muted-foreground mt-1">{seoContent.introText}</p>
                </div>
                <CategoryWebsitesList
                  initialWebsites={listedCategoryProjectCards}
                  summary={pageSummary}
                />
                <CategoryPaginationNav
                  categorySlug={category.slug}
                  page={categoryPage.page}
                  pageCount={categoryPage.pageCount}
                />
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
}
