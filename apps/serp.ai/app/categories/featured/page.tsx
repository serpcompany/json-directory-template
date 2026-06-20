import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import {
  getActiveCategories,
  getFeaturedListingCount
} from '@thedaviddias/web-core/category-navigation'
import {
  FeaturedCategoryRoutePage,
  featuredCategoryPageMetadata
} from '@thedaviddias/web-core/category-routes/featured-page'
import { CategoryWebsitesListRoute as CategoryWebsitesList } from '@thedaviddias/web-core/category-websites-list-route'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { getFeaturedCategoryRoute } from '@thedaviddias/web-core/routes'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'
import { FeaturedGuidesSectionRoute as FeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section-route'
import { SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'
import { Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getHomePageData } from '@/actions/get-home-page-data'
import { getGuides } from '@/lib/content-loader'

export const metadata = featuredCategoryPageMetadata

export default async function FeaturedPage() {
  const { allProjects } = await getHomePageData()
  const featuredProjects = allProjects.filter(project => project.featured === true)
  const featuredGuides = await getGuides()
  const featuredPath = getFeaturedCategoryRoute()
  const activeCategories = getActiveCategories(allProjects)
  const activeCategorySlugs = activeCategories.map(category => category.slug)

  if (getFeaturedListingCount(featuredProjects) === 0) {
    notFound()
  }

  return (
    <FeaturedCategoryRoutePage
      activeCategorySlugs={activeCategorySlugs}
      featuredGuides={featuredGuides}
      featuredProjects={featuredProjects}
      slots={{
        CategoryWebsitesList,
        ExternalResourcesSection,
        FeaturedGuidesSection,
        JsonLd,
        breadcrumb: (
          <Breadcrumb
            items={[{ name: 'Featured', href: featuredPath }]}
            baseUrl={SITE_PUBLIC_URL}
          />
        ),
        headingIcon: <Trophy className="h-6 w-6 text-yellow-500" />
      }}
    />
  )
}
