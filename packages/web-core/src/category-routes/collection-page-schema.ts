import { getRoute } from '../routes'
import { SITE_LOGO_URL, SITE_NAME, SITE_PUBLIC_URL, SITE_WEBSITE_ID } from '../seo-config'
import { siteConfig } from '../site-config'

type CollectionListing = {
  name: string
  slug: string
}

// Only the first listings are marked up; the page itself renders every listing.
const COLLECTION_ITEM_LIST_LIMIT = 20

/**
 * CollectionPage JSON-LD for category-style listing pages.
 *
 * The listings live in `mainEntity` as an ItemList of `ListItem`s (schema.org only defines
 * `position` on ListItem, and CollectionPage has no `itemListElement` or `numberOfItems`), and
 * each item points at the listing's own page on this site. The breadcrumb is not repeated here:
 * the visible `Breadcrumb` component emits the page's single BreadcrumbList.
 */
export function buildListingCollectionPageSchema(options: {
  dates: { dateModified?: string; datePublished?: string }
  description: string
  headline: string
  itemListDescription: string
  itemListName: string
  listings: CollectionListing[]
  name: string
  url: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': options.url,
    name: options.name,
    headline: options.headline,
    description: options.description,
    url: options.url,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      '@id': SITE_WEBSITE_ID,
      name: SITE_NAME,
      description: siteConfig.description,
      url: SITE_PUBLIC_URL
    },
    mainEntity: {
      '@type': 'ItemList',
      name: options.itemListName,
      description: options.itemListDescription,
      numberOfItems: options.listings.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: options.listings
        .slice(0, COLLECTION_ITEM_LIST_LIMIT)
        .map((listing, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: listing.name,
          url: `${SITE_PUBLIC_URL}${getRoute('listing.detail', { slug: listing.slug })}`
        }))
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_PUBLIC_URL,
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO_URL
      }
    },
    ...options.dates
  }
}
