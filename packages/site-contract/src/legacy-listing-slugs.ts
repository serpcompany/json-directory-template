// Legacy listing slugs: old listing URLs that must keep resolving after a listing is renamed or
// merged into another record. Each legacy slug becomes a static redirect page to the surviving
// listing (see `applyLegacyListingRedirects` in scripts/build-site.ts).

/**
 * Lowercase letters and digits, separated by single dots or hyphens. Dotted slugs such as
 * `hotmovsvideodownloader.pages.dev` are valid listing routes (see #146).
 */
export const LISTING_SLUG_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/

/**
 * Route segments ending in one of these extensions are treated as files rather than slashable
 * routes by the sitemap writer and route helpers, so they cannot be used as listing slugs.
 * Keep in sync with `PUBLIC_FILE_EXTENSION_PATTERN` in scripts/sitemap-files.ts.
 */
export const PUBLIC_FILE_EXTENSION_PATTERN =
  /\.(?:css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webp|woff2?|xml)$/i

/**
 * Removes leading and trailing `/` characters. A plain loop instead of `/^\/+|\/+$/g`, which
 * backtracks polynomially on long runs of `/` (CodeQL js/polynomial-redos).
 */
export function trimSlashes(value: string): string {
  let start = 0
  let end = value.length

  while (start < end && value[start] === '/') {
    start += 1
  }

  while (end > start && value[end - 1] === '/') {
    end -= 1
  }

  return value.slice(start, end)
}

function firstPathSegment(value: string): string {
  return trimSlashes(value).split('/')[0] ?? ''
}

export type LegacyListingSlugSource = {
  legacySlugs?: string[]
  slug: string
}

export type LegacyListingRedirect = {
  legacySlug: string
  slug: string
}

export type CollectLegacyListingRedirectsOptions = {
  /**
   * Top-level route segments the site already serves (for example `categories`, `brands`, the
   * listing base path). A legacy slug also gets a root redirect page at `/<legacy>/`, so it must
   * not shadow one of these.
   */
  reservedRootSegments?: Iterable<string>
  /**
   * Route segments the site already serves directly under the listing base path (for example
   * `best` for serp.ai's `/products/best/`). A legacy slug also gets a redirect page at
   * `/<listingBasePath>/<legacy>/`, so it must not shadow one of these.
   */
  reservedListingSegments?: Iterable<string>
  /** Listing base path, used in error messages. Defaults to `listing`. */
  listingBasePath?: string
}

export function getLegacyListingSlugFormatError(legacySlug: string): string | undefined {
  if (!LISTING_SLUG_PATTERN.test(legacySlug)) {
    return 'must use lowercase letters and digits separated by single "." or "-" characters'
  }

  if (PUBLIC_FILE_EXTENSION_PATTERN.test(legacySlug)) {
    return 'must not end in a public file extension because it would be served as a file'
  }

  return undefined
}

/**
 * Validates every listing's `legacySlugs` and returns one redirect per legacy slug.
 *
 * Throws when a legacy slug is malformed, equals a live listing slug (every live slug already has
 * a root alias redirect, so this also covers root alias collisions), appears more than once
 * across records, or shadows a reserved top-level route.
 */
export function collectLegacyListingRedirects(
  listings: LegacyListingSlugSource[],
  options: CollectLegacyListingRedirectsOptions = {}
): LegacyListingRedirect[] {
  const liveSlugs = new Set(listings.map(listing => listing.slug))
  const reservedRootSegments = new Set(
    [...(options.reservedRootSegments ?? [])].map(firstPathSegment).filter(Boolean)
  )
  const reservedListingSegments = new Set(
    [...(options.reservedListingSegments ?? [])].map(firstPathSegment).filter(Boolean)
  )
  const listingBasePath = trimSlashes(options.listingBasePath ?? 'listing')
  const ownersByLegacySlug = new Map<string, string>()
  const redirects: LegacyListingRedirect[] = []
  const errors: string[] = []

  for (const listing of listings) {
    for (const legacySlug of listing.legacySlugs ?? []) {
      const formatError = getLegacyListingSlugFormatError(legacySlug)

      if (formatError) {
        errors.push(`${listing.slug}: legacy slug "${legacySlug}" ${formatError}.`)
        continue
      }

      if (liveSlugs.has(legacySlug)) {
        errors.push(
          `${listing.slug}: legacy slug "${legacySlug}" is still a live listing slug (and root alias); remove the live record or the legacy slug.`
        )
        continue
      }

      if (reservedRootSegments.has(legacySlug)) {
        errors.push(
          `${listing.slug}: legacy slug "${legacySlug}" collides with the reserved top-level route "/${legacySlug}/".`
        )
        continue
      }

      if (reservedListingSegments.has(legacySlug)) {
        errors.push(
          `${listing.slug}: legacy slug "${legacySlug}" collides with the reserved route "/${listingBasePath}/${legacySlug}/".`
        )
        continue
      }

      const existingOwner = ownersByLegacySlug.get(legacySlug)

      if (existingOwner) {
        errors.push(
          existingOwner === listing.slug
            ? `${listing.slug}: legacy slug "${legacySlug}" is listed more than once.`
            : `${listing.slug}: legacy slug "${legacySlug}" is already claimed by ${existingOwner}.`
        )
        continue
      }

      ownersByLegacySlug.set(legacySlug, listing.slug)
      redirects.push({ legacySlug, slug: listing.slug })
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid product.legacySlugs:\n${errors.map(error => `- ${error}`).join('\n')}`)
  }

  return redirects.sort((left, right) => left.legacySlug.localeCompare(right.legacySlug))
}
