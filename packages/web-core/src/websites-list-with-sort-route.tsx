'use client'

import { Badge } from '@thedaviddias/design-system/badge'
import { ToggleGroup, ToggleGroupItem } from '@thedaviddias/design-system/toggle-group'
import type { WebsiteBrowseCardMetadata } from './content-query'
import { EmptyState } from './empty-state'
import { useAnalyticsEvents } from './root-shell-client'
import { siteCopy } from './site-copy'
import { Card } from './ui/card'
import { FaviconWithFallback } from './ui/favicon-with-fallback'
import { WebsitesListWithSort as SharedWebsitesListWithSort } from './websites-list-with-sort'

interface WebsitesListWithSortRouteProps {
  initialWebsites: WebsiteBrowseCardMetadata[]
  emptyTitle?: string
  emptyDescription?: string
  summary?: string
}

export function WebsitesListWithSortRoute({
  initialWebsites,
  summary,
  emptyTitle = siteCopy.categoryEmptyTitle,
  emptyDescription = siteCopy.categoryEmptyDescription
}: WebsitesListWithSortRouteProps) {
  const { trackSortChange } = useAnalyticsEvents()

  return (
    <SharedWebsitesListWithSort
      initialWebsites={initialWebsites}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      summary={summary}
      trackSortChange={trackSortChange}
      slots={{
        Badge,
        EmptyState,
        Card,
        FaviconWithFallback,
        ToggleGroup,
        ToggleGroupItem
      }}
    />
  )
}
