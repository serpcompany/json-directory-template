import { Badge } from '@thedaviddias/design-system/badge'
import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { FaviconWithFallback } from '../ui/favicon-with-fallback'
import { FavoriteButton } from '../ui/favorite-button'
import {
  WebsiteHero as SharedWebsiteHero,
  type WebsiteHeroProps as SharedWebsiteHeroProps
} from './website-hero'

interface WebsiteHeroRouteProps {
  website: SharedWebsiteHeroProps['website']
  breadcrumbItems: SharedWebsiteHeroProps['breadcrumbItems']
}

export function WebsiteHeroRoute({ website, breadcrumbItems }: WebsiteHeroRouteProps) {
  return (
    <SharedWebsiteHero
      website={website}
      breadcrumbItems={breadcrumbItems}
      slots={{ Badge, Breadcrumb, FavoriteButton, FaviconWithFallback }}
    />
  )
}
