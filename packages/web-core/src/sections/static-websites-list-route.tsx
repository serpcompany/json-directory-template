import type { WebsiteMetadata } from '../content-query'
import { Section } from '../layout/section'
import { WebsitesListWithSearchRoute } from '../websites-list-with-search-route'
import { StaticWebsitesList as SharedStaticWebsitesList } from './static-websites-list'

interface StaticWebsitesListRouteProps {
  websites: WebsiteMetadata[]
  totalCount?: number
  displayLimit?: number
}

export function StaticWebsitesListRoute({
  websites,
  totalCount,
  displayLimit,
}: StaticWebsitesListRouteProps) {
  return (
    <SharedStaticWebsitesList
      websites={websites}
      totalCount={totalCount}
      displayLimit={displayLimit}
      slots={{
        Section,
        WebsitesListWithSearch: WebsitesListWithSearchRoute,
      }}
    />
  )
}
