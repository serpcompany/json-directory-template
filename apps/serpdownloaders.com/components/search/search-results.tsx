'use client';

import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { SearchFilters } from '@/components/search/search-filters';
import { useSearch } from '@/components/search/use-search';
import { WebsitesListWithSort } from '@/components/websites-list-with-sort';
import { SearchResults as SharedSearchResults } from '@thedaviddias/web-core/search/search-results';

/**
 * Search results component for displaying and filtering websites
 *
 * @returns React component
 */
export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { results, loading, error } = useSearch(query);

  return (
    <SharedSearchResults
      query={query}
      results={results}
      loading={loading}
      error={error}
      slots={{ EmptyState, SearchFilters, WebsitesListWithSort }}
    />
  );
}
