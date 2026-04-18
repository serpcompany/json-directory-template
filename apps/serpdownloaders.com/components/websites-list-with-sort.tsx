'use client'

import { Badge } from '@thedaviddias/design-system/badge'
import { ToggleGroup, ToggleGroupItem } from '@thedaviddias/design-system/toggle-group'
import { useAnalyticsEvents } from '@/components/analytics-tracker'
import { EmptyState } from '@/components/empty-state'
import { Card } from '@/components/ui/card'
import { FaviconWithFallback } from '@/components/ui/favicon-with-fallback'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { WebsitesListWithSort as PackageWebsitesListWithSort } from '@thedaviddias/web-core/websites-list-with-sort'

interface WebsitesListWithSortProps {
  initialWebsites: WebsiteMetadata[]
  emptyTitle?: string
  emptyDescription?: string
}

/**
 * Client component that handles sorting on the client side
 * Initial data is server-side sorted, then client can re-sort
 */
export function WebsitesListWithSort({
  initialWebsites,
  emptyTitle = siteCopy.categoryEmptyTitle,
  emptyDescription = siteCopy.categoryEmptyDescription
}: WebsitesListWithSortProps) {
  const { trackSortChange } = useAnalyticsEvents()

  return (
    <PackageWebsitesListWithSort
      initialWebsites={initialWebsites}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      trackSortChange={trackSortChange}
      slots={{
        Badge,
        EmptyState,
        Card,
        FaviconWithFallback,
        ToggleGroup,
        ToggleGroupItem,
      }}
    />
  )
}
