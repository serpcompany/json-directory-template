import type { WebsiteMetadata } from '@/lib/content-loader';
import { CategoryWebsitesList as SharedCategoryWebsitesList } from '@thedaviddias/web-core/category-websites-list';
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
    <SharedCategoryWebsitesList
      initialWebsites={initialWebsites}
      slots={{ WebsitesListWithSort }}
    />
  );
}
