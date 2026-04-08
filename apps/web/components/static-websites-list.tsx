import { Section } from '@/components/layout/section'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { siteCopy } from '@/lib/site-copy'
import { WebsitesListWithSearch } from './websites-list-with-search'

interface StaticWebsitesListProps {
  websites: WebsiteMetadata[]
  totalCount?: number
  displayLimit?: number
}

/**
 * Wrapper for homepage websites list - passes through to client component with search
 */
export function StaticWebsitesList({
  websites,
  totalCount,
  displayLimit
}: StaticWebsitesListProps) {
  return (
    <Section
      title="Browse the Directory"
      description="Explore the complete directory and search by name, category, or description."
      titleId={siteCopy.allAnchorId}
    >
      <WebsitesListWithSearch
        initialWebsites={websites}
        totalCount={totalCount}
        displayLimit={displayLimit}
        emptyTitle="No entries found"
        emptyDescription={`There are no directory entries available. Try checking back later or ${siteCopy.submitLabel.toLowerCase()}.`}
      />
    </Section>
  )
}
