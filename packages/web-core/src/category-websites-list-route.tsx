import { CategoryWebsitesList as SharedCategoryWebsitesList } from './category-websites-list'
import type { WebsiteBrowseCardMetadata } from './content-query'
import { WebsitesListWithSortRoute } from './websites-list-with-sort-route'

interface CategoryWebsitesListRouteProps {
  initialWebsites: WebsiteBrowseCardMetadata[]
  summary?: string
}

export function CategoryWebsitesListRoute({
  initialWebsites,
  summary
}: CategoryWebsitesListRouteProps) {
  return (
    <SharedCategoryWebsitesList
      initialWebsites={initialWebsites}
      summary={summary}
      slots={{ WebsitesListWithSort: WebsitesListWithSortRoute }}
    />
  )
}
