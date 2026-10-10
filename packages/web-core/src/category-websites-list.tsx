import type { ComponentType } from 'react'
import type { WebsiteBrowseCardMetadata } from './content-query'
import { siteCopy } from './site-copy'

type WebsitesListWithSortProps = {
  emptyDescription?: string
  emptyTitle?: string
  initialWebsites: WebsiteBrowseCardMetadata[]
  summary?: string
}

interface CategoryWebsitesListProps {
  initialWebsites: WebsiteBrowseCardMetadata[]
  /** Replaces the default "Showing N ..." line, e.g. on paginated category pages. */
  summary?: string
  slots: {
    WebsitesListWithSort: ComponentType<WebsitesListWithSortProps>
  }
}

export function CategoryWebsitesList({
  initialWebsites,
  slots,
  summary
}: CategoryWebsitesListProps) {
  const { WebsitesListWithSort } = slots

  return (
    <WebsitesListWithSort
      initialWebsites={initialWebsites}
      emptyTitle={siteCopy.categoryEmptyTitle}
      emptyDescription={siteCopy.categoryEmptyDescription}
      summary={summary}
    />
  )
}
