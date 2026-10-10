import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { getCategoryBySlug } from '@thedaviddias/web-core/categories'
import { getCategoryDisplayName } from '@thedaviddias/web-core/category-display'
import { getActiveCategories } from '@thedaviddias/web-core/category-navigation'
import {
  generateCategoryPaginationStaticParams,
  getCategoryPageRoute,
  parseCategoryPageParam
} from '@thedaviddias/web-core/category-pagination'
import {
  CategoryRoutePage,
  generateCategoryRouteMetadata
} from '@thedaviddias/web-core/category-routes/category-page'
import { CategoryWebsitesListRoute as CategoryWebsitesList } from '@thedaviddias/web-core/category-websites-list-route'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { getRoute } from '@thedaviddias/web-core/routes'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'
import { FeaturedGuidesSectionRoute as FeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section-route'
import { SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHomePageData } from '@/actions/get-home-page-data'
import { getGuides, getWebsites } from '@/lib/content-loader'

interface CategoryPaginatedPageProps {
  params: Promise<{ category: string; page: string }>
}

// Category pages after the first; only generated when `browse.categoryPageSize` is set.
export async function generateStaticParams() {
  const websites = getWebsites()

  return generateCategoryPaginationStaticParams(getActiveCategories(websites), websites)
}

export async function generateMetadata({ params }: CategoryPaginatedPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const category = getCategoryBySlug(resolvedParams.category)
  const page = parseCategoryPageParam(resolvedParams.page)

  if (!category || !page) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.'
    }
  }

  const { allProjects } = await getHomePageData()
  return generateCategoryRouteMetadata({ allProjects, category, page })
}

export default async function CategoryPaginatedPage({ params }: CategoryPaginatedPageProps) {
  const resolvedParams = await params
  const category = getCategoryBySlug(resolvedParams.category)
  const page = parseCategoryPageParam(resolvedParams.page)

  if (!category || !page) {
    notFound()
  }

  const { allProjects, featuredProjects } = await getHomePageData()
  const featuredGuides = await getGuides()
  const activeCategorySlugs = getActiveCategories(allProjects).map(
    activeCategory => activeCategory.slug
  )
  const route = CategoryRoutePage({
    activeCategorySlugs,
    allProjects,
    category,
    featuredGuides,
    featuredProjects,
    page,
    slots: {
      CategoryWebsitesList,
      ExternalResourcesSection,
      FeaturedGuidesSection,
      JsonLd,
      breadcrumb: (
        <Breadcrumb
          items={[
            {
              name: getCategoryDisplayName(category.slug),
              href: getRoute('category.page', { category: category.slug })
            },
            { name: `Page ${page}`, href: getCategoryPageRoute(category.slug, page) }
          ]}
          baseUrl={SITE_PUBLIC_URL}
        />
      )
    }
  })

  if (route.categoryProjects.length === 0) {
    notFound()
  }

  return route.element
}
