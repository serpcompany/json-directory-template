import {
  categories,
  normalizeCategorySlug,
  resolveCategories,
  type Category,
} from './categories';

type CategoryLike = {
  categories?: string[];
  category?: string;
  featured?: boolean;
};

function normalizeListingCategory(category: string): string {
  return normalizeCategorySlug(category);
}

function resolveCategorySet(siteId?: string): Category[] {
  return siteId ? resolveCategories(siteId) : categories;
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

export function getUnknownCategorySlugs(
  listings: CategoryLike[],
  siteId?: string
): string[] {
  const knownCategorySlugs = new Set(
    resolveCategorySet(siteId).map((category) => category.slug)
  );

  return [
    ...new Set(
      listings
        .flatMap(getListingCategories)
        .filter((category) => !knownCategorySlugs.has(category))
    ),
  ];
}

export function getActiveCategories(
  listings: CategoryLike[],
  siteId?: string
): Category[] {
  const activeCategorySlugs = new Set(listings.flatMap(getListingCategories));

  return resolveCategorySet(siteId).filter((category) =>
    activeCategorySlugs.has(category.slug)
  );
}

export function getFeaturedListingCount(listings: CategoryLike[]): number {
  return listings.filter((listing) => listing.featured === true).length;
}

export function hasFeaturedListings(listings: CategoryLike[]): boolean {
  return getFeaturedListingCount(listings) > 0;
}
