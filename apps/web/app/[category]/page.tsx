import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHomePageData } from '@/actions/get-home-page-data'
import { CategoryWebsitesList } from '@/components/category-websites-list'
import { JsonLd } from '@/components/json-ld'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section'
import { NewsletterSection } from '@/components/sections/newsletter-section'
import { ExternalResourcesSection } from '@/components/sections/external-resources-section'
import { categories, getCategoryBySlug } from '@/lib/categories'
import { getGuides, getWebsites } from '@/lib/content-loader'
import { getActiveCategories, getFeaturedListingCount } from '@/lib/category-navigation'
import { getRoute } from '@/lib/routes'
import { getCategorySEO } from '@/lib/seo/category-seo'
import {
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_PUBLIC_URL,
  generateDynamicMetadata,
  optimizeMetaDescription
} from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'
import { siteConfig } from '@/lib/site-config'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

/**
 * Generates static params for all category pages
 */
export async function generateStaticParams() {
  return getActiveCategories(getWebsites()).map(category => ({
    category: category.slug
  }))
}

/**
 * Generates metadata for category pages with SEO-optimized descriptions
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const category = getCategoryBySlug(resolvedParams.category)

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.'
    }
  }

  // Get dynamic count and SEO content
  const { allProjects } = await getHomePageData()
  const categoryProjectsCount =
    category.slug === 'featured'
      ? allProjects.filter(p => p.featured === true).length
      : allProjects.filter(p => p.category === category.slug).length
  const seoContent = getCategorySEO(category.slug, category)

  // Enhanced title with count for better CTR
  const title =
    categoryProjectsCount > 0
      ? `${categoryProjectsCount}+ ${seoContent.metaTitle}`
      : seoContent.metaTitle

  // Use SEO-optimized description
  const description =
    categoryProjectsCount > 0
      ? `${categoryProjectsCount}+ ${siteCopy.listingName.plural}. ${seoContent.metaDescription}`
      : seoContent.metaDescription

  return generateDynamicMetadata({
    type: 'category',
    name: title,
    description: optimizeMetaDescription(description),
    slug: category.slug,
    additionalKeywords: seoContent.keywords
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params
  const category = getCategoryBySlug(resolvedParams.category)

  if (!category) {
    notFound()
  }

  const { allProjects, featuredProjects } = await getHomePageData()
  const featuredGuides = await getGuides()
  const seoContent = getCategorySEO(category.slug, category)
  const categoryPath = getRoute('category.page', { category: category.slug })
  const categoryUrl = `${SITE_PUBLIC_URL}${categoryPath}`
  const activeCategories = getActiveCategories(allProjects)
  const activeCategorySlugs = activeCategories.map(activeCategory => activeCategory.slug)

  // Special handling for featured category
  let categoryProjects = []
  if (category.slug === 'featured') {
    // For featured category, show all projects with featured: true
    categoryProjects = allProjects
      .filter(project => project.featured === true)
      .sort((a, b) => a.name.localeCompare(b.name))
  } else {
    // Filter projects by category and sort alphabetically by default
    categoryProjects = allProjects
      .filter(project => project.category === category.slug)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  if (categoryProjects.length === 0) {
    notFound()
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': categoryUrl,
          name: `${category.name} - ${SITE_NAME}`,
          headline: `${categoryProjects.length}+ ${category.name} ${siteCopy.listingName.pluralTitle}`,
          description: `Explore ${categoryProjects.length}+ curated ${category.name.toLowerCase()} ${siteCopy.listingName.plural} from ${SITE_NAME}. ${category.description}`,
          url: categoryUrl,
          inLanguage: 'en-US',
          isPartOf: {
            '@type': 'WebSite',
            '@id': SITE_PUBLIC_URL,
            name: SITE_NAME,
            description: siteConfig.description,
            url: SITE_PUBLIC_URL
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_PUBLIC_URL
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: category.name,
                item: categoryUrl
              }
            ]
          },
          numberOfItems: categoryProjects.length,
          itemListElement: categoryProjects.slice(0, 10).map((project, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: project.website,
            name: project.name,
            description: project.description
          })),
          mainEntity: {
            '@type': 'ItemList',
            name: `${category.name} ${siteCopy.listingName.pluralTitle}`,
            description: category.description,
            numberOfItems: categoryProjects.length,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            itemListElement: categoryProjects.slice(0, 20).map((project, index) => ({
              '@type': 'Thing',
              position: index + 1,
              url: project.website,
              name: project.name
            }))
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_PUBLIC_URL,
            logo: {
              '@type': 'ImageObject',
              url: SITE_LOGO_URL
            }
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString()
        }}
      />
      {/* FAQ Structured Data if available */}
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
            {/* Breadcrumb Navigation */}
            <Breadcrumb
              items={[{ name: category.name, href: categoryPath }]}
              baseUrl={SITE_PUBLIC_URL}
            />

            {/* Category Websites Section */}
            <section className="space-y-6">
              <div className="sticky top-16 z-35 bg-background border-b py-4 -mx-6 px-6">
                <div className="flex items-center gap-3">
                  <category.icon className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">{seoContent.h1Title}</h1>
                </div>
                <p className="text-muted-foreground mt-1">{seoContent.introText}</p>
              </div>
              <CategoryWebsitesList
                initialWebsites={categoryProjects}
                categoryType={category.type}
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
