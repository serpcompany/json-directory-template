export type FeaturedOnBadgeTheme = 'light' | 'dark'

const DEFAULT_FEATURED_BADGE_PUBLIC_BASE_URL = 'https://embeds.serp.co'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function normalizeBadgeKey(value: string): string {
  return value.replace(/^\/+/, '')
}

function getDefaultFeaturedOnBadgeKey(siteId: string, theme: FeaturedOnBadgeTheme): string {
  return `badge/featured-on-${siteId}-${theme}.svg`
}

export function getFeaturedOnBadgePreviewPathFromKey(badgeKey: string): string {
  return `/${normalizeBadgeKey(badgeKey)}`
}

export function getFeaturedOnBadgePreviewPath(siteId: string, theme: FeaturedOnBadgeTheme): string {
  return getFeaturedOnBadgePreviewPathFromKey(getDefaultFeaturedOnBadgeKey(siteId, theme))
}

export function getFeaturedOnBadgePublicUrlFromKey(
  badgeKey: string,
  publicBaseUrl = process.env.NEXT_PUBLIC_FEATURED_BADGE_BASE_URL ||
    DEFAULT_FEATURED_BADGE_PUBLIC_BASE_URL
): string {
  return `${trimTrailingSlash(publicBaseUrl)}/${normalizeBadgeKey(badgeKey)}`
}

export function getFeaturedOnBadgePublicUrl(
  siteId: string,
  theme: FeaturedOnBadgeTheme,
  publicBaseUrl = process.env.NEXT_PUBLIC_FEATURED_BADGE_BASE_URL ||
    DEFAULT_FEATURED_BADGE_PUBLIC_BASE_URL
): string {
  return getFeaturedOnBadgePublicUrlFromKey(
    getDefaultFeaturedOnBadgeKey(siteId, theme),
    publicBaseUrl
  )
}
