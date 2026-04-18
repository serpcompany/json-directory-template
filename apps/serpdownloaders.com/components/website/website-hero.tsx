import { Badge } from '@thedaviddias/design-system/badge'
import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { FavoriteButton } from '@/components/ui/favorite-button'
import { FaviconWithFallback } from '@/components/ui/favicon-with-fallback'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { WebsiteHero as SharedWebsiteHero } from '@thedaviddias/web-core/website/website-hero'

interface WebsiteHeroProps {
  website: WebsiteMetadata
  breadcrumbItems: Array<{ name: string; href: string }>
}

export function WebsiteHero({ website, breadcrumbItems }: WebsiteHeroProps) {
  return (
    <SharedWebsiteHero
      website={website}
      breadcrumbItems={breadcrumbItems}
      slots={{ Badge, Breadcrumb, FavoriteButton, FaviconWithFallback }}
    />
  )
}
