'use client'

import { Badge } from '@thedaviddias/design-system/badge'
import { cn } from '@thedaviddias/design-system/lib/utils'
import Link from 'next/link'
import type { WebsiteRelatedCardMetadata } from '../content-query'
import { getRoute } from '../routes'
import { Card } from '../ui/card'
import { FaviconWithFallback } from '../ui/favicon-with-fallback'
import { FavoriteButton } from '../ui/favorite-button'

interface ListingCardProps {
  item: WebsiteRelatedCardMetadata
  analyticsSource?: string
  className?: string
}

function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return ''

  let text = ''
  let insideTag = false

  for (const char of html) {
    if (char === '<') {
      insideTag = true
      continue
    }

    if (insideTag) {
      if (char === '>') {
        insideTag = false
      }
      continue
    }

    text += char
  }

  return text.trim()
}

function UnofficialBadge() {
  return (
    <Badge
      variant="outline"
      className="text-xs border-yellow-500/20 bg-yellow-500/10 dark:border-yellow-400/30 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20 dark:hover:bg-yellow-400/20 transition-colors"
    >
      Unofficial
    </Badge>
  )
}

function ListingCardLink({
  item,
  analyticsSource,
  defaultSource
}: ListingCardProps & { defaultSource: string }) {
  return (
    <Link
      href={getRoute('listing.detail', { slug: item.slug })}
      className="block after:absolute after:inset-0 after:content-[''] z-10"
      data-analytics="website-click"
      data-website-name={item.name}
      data-website-slug={item.slug}
      data-source={analyticsSource || defaultSource}
    >
      {item.name}
    </Link>
  )
}

export function CompactListingCard({ item, analyticsSource, className }: ListingCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 sm:p-2.5 rounded-lg transition-all duration-200 relative',
        'hover:bg-muted/50 hover:translate-x-1',
        className
      )}
    >
      <FaviconWithFallback
        website={item.website}
        name={item.name}
        logoUrl={item.media?.logo}
        size={32}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-xs sm:text-sm md:text-base truncate">
            <ListingCardLink
              item={item}
              analyticsSource={analyticsSource}
              defaultSource="grid-compact"
            />
          </h3>
          {item.isUnofficial && <UnofficialBadge />}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {stripHtmlTags(item.description)}
        </p>
      </div>
      <div className="flex-shrink-0 ml-2">
        <FavoriteButton slug={item.slug} size="sm" variant="ghost" />
      </div>
    </div>
  )
}

export function ListingCard({ item, analyticsSource }: ListingCardProps) {
  return (
    <Card className="p-4 relative h-full group">
      <div className="space-y-1.5">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-start justify-between">
            <FaviconWithFallback
              website={item.website}
              name={item.name}
              logoUrl={item.media?.logo}
              size={32}
            />
            <FavoriteButton slug={item.slug} size="sm" variant="default" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs sm:text-sm md:text-base truncate">
              <ListingCardLink
                item={item}
                analyticsSource={analyticsSource}
                defaultSource="grid-default"
              />
            </h3>
            {item.isUnofficial && <UnofficialBadge />}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {stripHtmlTags(item.description)}
          </p>
        </div>
      </div>
    </Card>
  )
}
