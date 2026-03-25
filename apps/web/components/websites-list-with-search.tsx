'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAnalyticsEvents } from '@/components/analytics-tracker';
import { EmptyState } from '@/components/empty-state';
import { LLMGrid } from '@/components/llm/llm-grid';
import { WebsitesSearchControls } from '@/components/websites-search-controls';
import { useFavoritesFilter } from '@/hooks/use-favorites-filter';
import type { WebsiteMetadata } from '@/lib/content-loader';
import { getRoute } from '@/lib/routes';
import { siteCopy } from '@/lib/site-copy';

interface WebsitesListWithSearchProps {
  initialWebsites: WebsiteMetadata[];
  emptyTitle?: string;
  emptyDescription?: string;
  initialShowFavoritesOnly?: boolean;
  totalCount?: number;
}

export function WebsitesListWithSearch({
  initialWebsites,
  emptyTitle = 'No entries found',
  emptyDescription = `There are no directory entries available. Try checking back later or ${siteCopy.submitLabelSentence}.`,
  initialShowFavoritesOnly = false,
  totalCount,
}: WebsitesListWithSearchProps) {
  const [sortBy, setSortBy] = useState<'name' | 'latest'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    initialShowFavoritesOnly
  );
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allWebsites] = useState<WebsiteMetadata[]>(initialWebsites);
  const { trackSearch, trackSortChange } = useAnalyticsEvents();
  const { favoriteWebsites, hasFavorites } = useFavoritesFilter(allWebsites);

  useEffect(() => {
    requestAnimationFrame(() => {
      const savedSortBy = localStorage.getItem('websites-sort-by');

      if (savedSortBy !== null) {
        const parsedSortBy = JSON.parse(savedSortBy);
        if (parsedSortBy === 'name' || parsedSortBy === 'latest') {
          setSortBy(parsedSortBy);
        }
      }

      setIsClient(true);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('websites-sort-by', JSON.stringify(sortBy));
    }
  }, [sortBy, isClient]);

  const filteredAndSortedWebsites = useMemo(() => {
    let websites = showFavoritesOnly ? [...favoriteWebsites] : [...allWebsites];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (normalizedQuery) {
      websites = websites.filter((website) => {
        const searchableText = `${website.name} ${website.description} ${
          website.category
        } ${(website.categories || []).join(' ')}`.toLowerCase();
        return searchableText.includes(normalizedQuery);
      });
    }

    if (sortBy === 'latest') {
      return websites.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });
    }

    return websites.sort((a, b) => a.name.localeCompare(b.name));
  }, [allWebsites, favoriteWebsites, searchQuery, showFavoritesOnly, sortBy]);

  if (!initialWebsites.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={siteCopy.submitLabel}
        actionHref={getRoute('submit')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WebsitesSearchControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        hasFavorites={hasFavorites}
        filteredCount={filteredAndSortedWebsites.length}
        trackSearch={trackSearch}
        trackSortChange={trackSortChange}
      />

      {filteredAndSortedWebsites.length === 0 ? (
        searchQuery.trim() ? (
          <EmptyState
            title="No results found"
            description={`No entries found matching "${searchQuery}". Try a different search term.`}
            actionLabel="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )
      ) : (
        <div>
          <h2 className="mb-6 text-2xl font-semibold sr-only">
            {siteCopy.listingName.pluralTitle}
          </h2>
          {searchQuery && (
            <p className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAndSortedWebsites.length} result
              {filteredAndSortedWebsites.length !== 1 ? 's' : ''} for "
              {searchQuery}"
            </p>
          )}

          <div className="relative">
            <div
              className={`transition-opacity duration-300 ${
                isLoading ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <LLMGrid
                items={filteredAndSortedWebsites}
                maxItems={undefined}
                animateIn={!searchQuery.trim() && !isLoading}
                className="transition-all duration-500 ease-in-out"
              />
            </div>
          </div>

          <div className="mt-8 text-center" aria-live="polite">
            <div className="text-sm text-muted-foreground">
              <p>
                Showing all {filteredAndSortedWebsites.length} matching{' '}
                {siteCopy.listingName.plural}.
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Directory size: {totalCount || allWebsites.length}{' '}
              {siteCopy.listingName.plural}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
