import type { WebsiteMetadata } from '@/lib/content-loader'
import { StaticWebsitesList as PackageStaticWebsitesList } from '@thedaviddias/web-core/sections/static-websites-list'
import { Section } from '@/components/layout/section'
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
    <PackageStaticWebsitesList
      websites={websites}
      totalCount={totalCount}
      displayLimit={displayLimit}
      slots={{ Section, WebsitesListWithSearch }}
    />
  )
}
