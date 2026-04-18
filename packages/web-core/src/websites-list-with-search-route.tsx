'use client'

import { useAnalyticsEvents } from './root-shell-client'
import type { WebsiteMetadata } from './content-query'
import { EmptyState } from './empty-state'
import { useFavoritesFilter } from './hooks/use-favorites-filter'
import { LLMGrid } from './llm/llm-grid'
import { WebsitesSearchControls } from './websites-search-controls'
import { WebsitesListWithSearch as SharedWebsitesListWithSearch } from './websites-list-with-search'

interface WebsitesListWithSearchRouteProps {
  initialWebsites: WebsiteMetadata[]
  emptyTitle?: string
  emptyDescription?: string
  initialShowFavoritesOnly?: boolean
  totalCount?: number
  displayLimit?: number
}

export function WebsitesListWithSearchRoute(
  props: WebsitesListWithSearchRouteProps
) {
  const analytics = useAnalyticsEvents()
  const favorites = useFavoritesFilter(props.initialWebsites)

  return (
    <SharedWebsitesListWithSearch
      {...props}
      analytics={analytics}
      favorites={favorites}
      slots={{
        EmptyState,
        LLMGrid,
        WebsitesSearchControls,
      }}
    />
  )
}
