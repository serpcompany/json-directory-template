import { categories, normalizeCategorySlug, type Category } from './categories'

type CategoryLike = {
  category: string
  featured?: boolean
}

const knownCategorySlugs = new Set(categories.map(category => category.slug))

function normalizeListingCategory(category: string): string {
  return normalizeCategorySlug(category)
}

export function getUnknownCategorySlugs(listings: CategoryLike[]): string[] {
  return [...new Set(
    listings
      .map(listing => normalizeListingCategory(listing.category))
      .filter(category => !knownCategorySlugs.has(category))
  )]
}

export function getActiveCategories(listings: CategoryLike[]): Category[] {
  const activeCategorySlugs = new Set(
    listings.map(listing => normalizeListingCategory(listing.category))
  )

  return categories.filter(category => activeCategorySlugs.has(category.slug))
}

export function getFeaturedListingCount(listings: CategoryLike[]): number {
  return listings.filter(listing => listing.featured === true).length
}

export function hasFeaturedListings(listings: CategoryLike[]): boolean {
  return getFeaturedListingCount(listings) > 0
}
