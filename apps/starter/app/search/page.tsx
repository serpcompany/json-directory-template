import type { Metadata } from 'next';
import { getWebsites } from '@/lib/content-loader';
import {
  SearchIndexPage,
  generateSearchPageMetadata,
} from '@thedaviddias/web-core/search/index-page';
import { SearchResultsRoute as SearchResults } from '@thedaviddias/web-core/search/search-results-route';

/**
 * Generate metadata for the static search shell.
 * @returns Promise resolving to Next.js Metadata object
 */
export async function generateMetadata(): Promise<Metadata> {
  return generateSearchPageMetadata();
}

export default function SearchPage() {
  return (
    <SearchIndexPage
      allProjects={getWebsites()}
      slots={{ SearchResults }}
    />
  );
}
