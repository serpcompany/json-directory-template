import type { WebsiteMetadata } from '@/lib/content-loader';
import { siteCopy } from '@/lib/site-copy';
import { WebsitesListWithSort } from './websites-list-with-sort';

interface CategoryWebsitesListProps {
  initialWebsites: WebsiteMetadata[];
}

/**
 * Wrapper for category websites list - passes through to client component
 */
export function CategoryWebsitesList({
  initialWebsites,
}: CategoryWebsitesListProps) {
  return (
    <WebsitesListWithSort
      initialWebsites={initialWebsites}
      emptyTitle={siteCopy.categoryEmptyTitle}
      emptyDescription={siteCopy.categoryEmptyDescription}
    />
  );
}
