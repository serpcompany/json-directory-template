import { categories, normalizeCategorySlug, type Category } from './categories';

type CategoryLike = {
  categories?: string[];
  category?: string;
  featured?: boolean;
};

const knownCategorySlugs = new Set(categories.map((category) => category.slug));

function normalizeListingCategory(category: string): string {
  return normalizeCategorySlug(category);
}

export function getListingCategories(listing: CategoryLike): string[] {
  const normalizedCategories = [
    ...(listing.category ? [listing.category] : []),
    ...(listing.categories || []),
  ]
    .map((category) => category.trim())
    .filter(Boolean)
    .map(normalizeListingCategory);

  return [...new Set(normalizedCategories)];
}

export function listingMatchesCategory(
  listing: CategoryLike,
  categorySlug: string
): boolean {
  return getListingCategories(listing).includes(
    normalizeListingCategory(categorySlug)
  );
}

export function getUnknownCategorySlugs(listings: CategoryLike[]): string[] {
  return [
    ...new Set(
      listings
        .flatMap(getListingCategories)
        .filter((category) => !knownCategorySlugs.has(category))
    ),
  ];
}

export function getActiveCategories(listings: CategoryLike[]): Category[] {
  const activeCategorySlugs = new Set(listings.flatMap(getListingCategories));

  return categories.filter((category) =>
    activeCategorySlugs.has(category.slug)
  );
}

export function getFeaturedListingCount(listings: CategoryLike[]): number {
  return listings.filter((listing) => listing.featured === true).length;
}

export function hasFeaturedListings(listings: CategoryLike[]): boolean {
  return getFeaturedListingCount(listings) > 0;
}
