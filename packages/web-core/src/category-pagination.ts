import type { Category } from './categories'
import { type CategoryLike, listingMatchesCategory } from './category-navigation'
import { getRoute } from './routes'
import { siteConfig } from './site-config'

/** Path segment for category pages after the first: `<category route>page/<n>/`. */
export const CATEGORY_PAGE_SEGMENT = 'page'

export type CategoryPageSlice<T> = {
  /** Listings on this page. */
  items: T[]
  page: number
  pageCount: number
  /** Zero-based index of the first listing on this page within the category. */
  startIndex: number
  totalCount: number
}

export function getConfiguredCategoryPageSize(): number | undefined {
  return siteConfig.browse.categoryPageSize
}

export function getCategoryPageCount(totalCount: number, pageSize?: number): number {
  return pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1
}

/** Page 1 is the category route itself; later pages live under it. */
export function getCategoryPageRoute(categorySlug: string, page: number): string {
  const categoryRoute = getRoute('category.page', { category: categorySlug })

  return page <= 1 ? categoryRoute : `${categoryRoute}${CATEGORY_PAGE_SEGMENT}/${page}/`
}

/**
 * Returns the listings for one category page, or `undefined` when the page does not exist.
 * Without a page size every listing is on page 1.
 */
export function sliceCategoryPage<T>(
  listings: T[],
  page: number,
  pageSize = getConfiguredCategoryPageSize()
): CategoryPageSlice<T> | undefined {
  const pageCount = getCategoryPageCount(listings.length, pageSize)

  if (!Number.isInteger(page) || page < 1 || page > pageCount) {
    return undefined
  }

  const startIndex = pageSize ? (page - 1) * pageSize : 0
  const items = pageSize ? listings.slice(startIndex, startIndex + pageSize) : listings

  return { items, page, pageCount, startIndex, totalCount: listings.length }
}

/** Static params for every category page after the first (none when pagination is off). */
export function generateCategoryPaginationStaticParams(
  categories: Category[],
  listings: CategoryLike[],
  pageSize = getConfiguredCategoryPageSize()
): Array<{ category: string; page: string }> {
  if (!pageSize) {
    return []
  }

  return categories.flatMap(category => {
    const totalCount = listings.filter(listing =>
      listingMatchesCategory(listing, category.slug)
    ).length
    const pageCount = getCategoryPageCount(totalCount, pageSize)

    return Array.from({ length: pageCount - 1 }, (_, index) => ({
      category: category.slug,
      page: String(index + 2)
    }))
  })
}

/** Parses the `[page]` route param; only canonical integers 2 and up are page routes. */
export function parseCategoryPageParam(value: string): number | undefined {
  if (!/^[1-9]\d*$/.test(value)) {
    return undefined
  }

  const page = Number(value)

  return page >= 2 ? page : undefined
}
