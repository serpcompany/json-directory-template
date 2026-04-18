'use client'

import { Badge } from '@thedaviddias/design-system/badge'
import { ToggleGroup, ToggleGroupItem } from '@thedaviddias/design-system/toggle-group'
import { useAnalyticsEvents } from './root-shell-client'
import type { WebsiteMetadata } from './content-query'
import { EmptyState } from './empty-state'
import { siteCopy } from './site-copy'
import { Card } from './ui/card'
import { FaviconWithFallback } from './ui/favicon-with-fallback'
import { WebsitesListWithSort as SharedWebsitesListWithSort } from './websites-list-with-sort'

interface WebsitesListWithSortRouteProps {
  initialWebsites: WebsiteMetadata[]
  emptyTitle?: string
  emptyDescription?: string
}

export function WebsitesListWithSortRoute({
  initialWebsites,
  emptyTitle = siteCopy.categoryEmptyTitle,
  emptyDescription = siteCopy.categoryEmptyDescription,
}: WebsitesListWithSortRouteProps) {
  const { trackSortChange } = useAnalyticsEvents()

  return (
    <SharedWebsitesListWithSort
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
