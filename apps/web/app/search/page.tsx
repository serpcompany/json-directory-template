import type { Metadata } from 'next';
import { SearchResults } from '@/components/search/search-results';
import { getWebsites } from '@/lib/content-loader';
import {
  SearchIndexPage,
  generateSearchPageMetadata,
} from '@thedaviddias/web-core/search/index-page';

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
