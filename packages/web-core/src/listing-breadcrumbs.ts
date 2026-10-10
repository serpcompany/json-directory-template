import { getCategoryDisplayName } from './category-display'
import { getCanonicalListingListRoute, getRoute, routes } from './routes'
import { siteCopy } from './site-copy'

export type ListingBreadcrumbItem = {
  href: string
  name: string
}

type ListingBreadcrumbSource = {
  category?: string
  name: string
  slug: string
}

/**
 * Visible breadcrumb trail (after "Home") for a listing detail page.
 *
 * The listing index (`/<listingBasePath>/`) is only a breadcrumb level when it is a canonical,
 * indexable page. Sites that keep it out of the sitemap (`sitemap.excludedPaths`) either do not
 * generate it or redirect it to the homepage, so pointing a crumb at it would repeat "Home" or link
 * to a missing or non-canonical page. Those sites use the listing's canonical (first) category
 * page as the parent level instead: Home > Category > Listing.
 */
export function getListingDetailBreadcrumbItems(
  listing: ListingBreadcrumbSource
): ListingBreadcrumbItem[] {
  const listingItem = {
    href: getRoute('listing.detail', { slug: listing.slug }),
    name: listing.name
  }
  const listingListRoute = getCanonicalListingListRoute()

  if (listingListRoute === routes.listing.list) {
    return [{ href: listingListRoute, name: siteCopy.listingName.pluralTitle }, listingItem]
  }

  if (listing.category) {
    return [
      {
        href: getRoute('category.page', { category: listing.category }),
        name: getCategoryDisplayName(listing.category)
      },
      listingItem
    ]
  }

  return [listingItem]
}
