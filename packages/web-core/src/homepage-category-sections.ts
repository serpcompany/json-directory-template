import type { Category } from './categories'
import { getCategoryDisplayName } from './category-display'
import { getActiveCategories, getListingCategories, listingMatchesCategory } from './category-navigation'
import type { WebsiteMetadata } from './content-query'
import { getRoute } from './routes'

export const DEFAULT_HOMEPAGE_CATEGORY_SECTION_LIMIT = 12

export type HomepageCategorySection = {
  category: Category
  href: string
  listings: WebsiteMetadata[]
  name: string
  totalCount: number
}

/**
 * Groups listings into one homepage section per active category, in the site's `categories.json`
 * order. Each listing appears once, under its canonical (first) category, so overlapping umbrella
 * categories do not repeat cards; `totalCount` still counts every listing in the category page.
 */
export function buildHomepageCategorySections(
  listings: WebsiteMetadata[],
  options: { limit?: number; siteId?: string } = {}
): HomepageCategorySection[] {
  const limit = options.limit ?? DEFAULT_HOMEPAGE_CATEGORY_SECTION_LIMIT

  return getActiveCategories(listings, options.siteId).flatMap(category => {
    const primaryListings = listings
      .filter(listing => getListingCategories(listing)[0] === category.slug)
      .sort((left, right) => left.name.localeCompare(right.name))

    if (primaryListings.length === 0) {
      return []
    }

    return [
      {
        category,
        href: getRoute('category.page', { category: category.slug }),
        listings: primaryListings.slice(0, limit),
        name: getCategoryDisplayName(category.slug),
        totalCount: listings.filter(listing => listingMatchesCategory(listing, category.slug))
          .length
      }
    ]
  })
}
