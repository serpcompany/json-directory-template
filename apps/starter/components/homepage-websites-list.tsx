'use client'

import { ErrorBoundaryCustom } from '@thedaviddias/design-system/error-boundary'
import { ToggleGroup, ToggleGroupItem } from '@thedaviddias/design-system/toggle-group'
import { Clock, SortAsc } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWebsiteFilters } from '@/hooks/use-website-filters'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { EmptyState } from '@thedaviddias/web-core/empty-state'
import { LLMGrid } from '@thedaviddias/web-core/llm/llm-grid'
import { getRoute } from '@thedaviddias/web-core/routes'
import { siteCopy } from '@thedaviddias/web-core/site-copy'

interface HomepageWebsitesListProps {
  initialWebsites: WebsiteMetadata[]
}

/**
 * Type guard to validate WebsiteMetadata objects
 */
function isValidWebsite(website: any): website is WebsiteMetadata {
  const isValid =
    website &&
    typeof website.slug === 'string' &&
    typeof website.name === 'string' &&
    typeof website.description === 'string' &&
    typeof website.website === 'string' &&
    typeof website.category === 'string' &&
    typeof website.publishedAt === 'string'

  return isValid
}

/**
 * Homepage version of websites list without category filters (since they're in sidebar)
 * Shows content type filters and sort options in a clean grid layout
 */
export function HomepageWebsitesList({ initialWebsites }: HomepageWebsitesListProps) {
  const [websites, setWebsites] = useState(initialWebsites)
  const { sortBy, setSortBy } = useWebsiteFilters({
    includeCategory: false // Don't handle category on homepage
  })

  // Update filtered and sorted websites when filters or initial websites change
  useEffect(() => {
    let filteredWebsites = [...initialWebsites]

    // Sort by selected criteria
    if (sortBy === 'latest') {
      filteredWebsites.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
    } else if (sortBy === 'name') {
      filteredWebsites.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Validate websites after all filtering and sorting
    const validWebsites = filteredWebsites.filter(isValidWebsite)
    setWebsites(validWebsites)
  }, [initialWebsites, sortBy])

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <ToggleGroup
            type="single"
            value={sortBy}
            onValueChange={(value: string) => value && setSortBy(value)}
            className="bg-background border rounded-md"
          >
            <ToggleGroupItem
              value="latest"
              className="px-3 py-2 h-10 data-[state=on]:bg-accent cursor-pointer"
            >
              <Clock className="size-4 mr-2" />
              <span className="text-sm">Latest</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="name"
              className="px-3 py-2 h-10 data-[state=on]:bg-accent cursor-pointer"
            >
              <SortAsc className="size-4 mr-2" />
              <span className="text-sm">Name</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Results - Always Grid */}
      {websites.length === 0 ? (
        <EmptyState
          title={`No ${siteCopy.listingName.plural} found`}
          description={`There are no ${siteCopy.listingName.plural} matching your current filters. Try adjusting your filters or add a new ${siteCopy.listingName.singular}.`}
          actionLabel={siteCopy.submitLabel}
          actionHref={getRoute('submit')}
        />
      ) : (
        <ErrorBoundaryCustom>
          <h2 className="text-2xl font-semibold mb-6 sr-only">{siteCopy.allLabel}</h2>
          <LLMGrid items={websites} />
        </ErrorBoundaryCustom>
      )}
    </div>
  )
}
