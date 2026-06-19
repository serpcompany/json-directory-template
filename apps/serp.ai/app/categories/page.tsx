import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { getCategoryDisplayName } from '@thedaviddias/web-core/category-display'
import {
  getActiveCategories,
  getFeaturedListingCount,
  listingMatchesCategory
} from '@thedaviddias/web-core/category-navigation'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { AppSidebar } from '@thedaviddias/web-core/layout/app-sidebar'
import { getRoute } from '@thedaviddias/web-core/routes'
import { generateBaseMetadata, SITE_NAME, SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getHomePageData } from '@/actions/get-home-page-data'

export const metadata: Metadata = generateBaseMetadata({
  title: `Categories | ${SITE_NAME}`,
  description: `Browse ${SITE_NAME} categories.`,
  path: '/categories/'
})

export default async function CategoriesPage() {
  const { allProjects, featuredProjects } = await getHomePageData()
  const activeCategories = getActiveCategories(allProjects)
  const activeCategorySlugs = activeCategories.map(category => category.slug)

  const categoryItems = activeCategories.map(category => {
    const count = allProjects.filter(project =>
      listingMatchesCategory(project, category.slug)
    ).length

    return {
      category,
      count,
      href: getRoute('category.page', { category: category.slug }),
      name: getCategoryDisplayName(category.slug)
    }
  })

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${SITE_PUBLIC_URL}/categories/`,
          name: `Categories | ${SITE_NAME}`,
          url: `${SITE_PUBLIC_URL}/categories/`,
          isPartOf: {
            '@type': 'WebSite',
            '@id': SITE_PUBLIC_URL,
            name: SITE_NAME,
            url: SITE_PUBLIC_URL
          },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: categoryItems.length,
            itemListElement: categoryItems.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: `${SITE_PUBLIC_URL}${item.href}`
            }))
          }
        }}
      />
      <div className="border-t">
        <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
          <AppSidebar
            availableCategorySlugs={activeCategorySlugs}
            featuredCount={getFeaturedListingCount(featuredProjects)}
          />

          <div className="relative flex h-full w-full flex-col gap-6 px-6 pt-6 pb-16">
            <Breadcrumb
              items={[{ name: 'Categories', href: '/categories/' }]}
              baseUrl={SITE_PUBLIC_URL}
            />

            <section className="space-y-6">
              <div className="sticky top-16 z-35 bg-background border-b py-4 -mx-6 px-6">
                <h1 className="text-2xl font-bold">Categories</h1>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map(({ category, count, href, name }) => (
                  <Link
                    key={category.slug}
                    href={href}
                    className="group flex min-h-24 items-center gap-3 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-muted/50"
                  >
                    <category.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {count} {count === 1 ? 'product' : 'products'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
