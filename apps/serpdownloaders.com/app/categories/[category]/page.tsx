import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHomePageData } from '@/actions/get-home-page-data'
import { getGuides, getWebsites } from '@/lib/content-loader'
import {
  CategoryRoutePage,
  generateCategoryRouteMetadata,
  generateCategoryRouteStaticParams,
} from '@thedaviddias/web-core/category-routes/category-page'
import { getCategoryDisplayName } from '@thedaviddias/web-core/category-display'
import { CategoryWebsitesListRoute as CategoryWebsitesList } from '@thedaviddias/web-core/category-websites-list-route'
import {
  getActiveCategories,
  getFeaturedListingCount,
} from '@thedaviddias/web-core/category-navigation'
import { getCategoryBySlug } from '@thedaviddias/web-core/categories'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { getRoute } from '@thedaviddias/web-core/routes'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'
import { FeaturedGuidesSectionRoute as FeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section-route'
import { SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  return generateCategoryRouteStaticParams(getActiveCategories(getWebsites()))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const category = getCategoryBySlug(resolvedParams.category)

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    }
  }

  const { allProjects } = await getHomePageData()
  return generateCategoryRouteMetadata({ allProjects, category })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params
  const category = getCategoryBySlug(resolvedParams.category)

  if (!category) {
    notFound()
  }

  const { allProjects, featuredProjects } = await getHomePageData()
  const featuredGuides = await getGuides()
  const categoryPath = getRoute('category.page', { category: category.slug })
  const activeCategories = getActiveCategories(allProjects)
  const activeCategorySlugs = activeCategories.map(activeCategory => activeCategory.slug)
  const route = CategoryRoutePage({
    activeCategorySlugs,
    allProjects,
    category,
    featuredGuides,
    featuredProjects,
    slots: {
      CategoryWebsitesList,
      ExternalResourcesSection,
      FeaturedGuidesSection,
      JsonLd,
      breadcrumb: (
        <Breadcrumb
          items={[{ name: getCategoryDisplayName(category.slug), href: categoryPath }]}
          baseUrl={SITE_PUBLIC_URL}
        />
      ),
    },
  })

  if (route.categoryProjects.length === 0) {
    notFound()
  }

  return route.element
}
