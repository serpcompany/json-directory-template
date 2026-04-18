import { Badge } from '@thedaviddias/design-system/badge'
import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { WebsiteMetadata } from '../content-query'
import { FavoriteButton } from '../ui/favorite-button'
import { FaviconWithFallback } from '../ui/favicon-with-fallback'
import { WebsiteHero as SharedWebsiteHero } from './website-hero'

interface WebsiteHeroRouteProps {
  website: WebsiteMetadata
  breadcrumbItems: Array<{ name: string; href: string }>
}

export function WebsiteHeroRoute({
  website,
  breadcrumbItems,
}: WebsiteHeroRouteProps) {
  return (
    <SharedWebsiteHero
      website={website}
      breadcrumbItems={breadcrumbItems}
      slots={{ Badge, Breadcrumb, FavoriteButton, FaviconWithFallback }}
    />
  )
}
