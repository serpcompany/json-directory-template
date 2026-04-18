import type { ComponentType } from 'react';
import type { WebsiteMetadata } from './content-query';
import { siteCopy } from './site-copy';

type WebsitesListWithSortProps = {
  emptyDescription?: string;
  emptyTitle?: string;
  initialWebsites: WebsiteMetadata[];
};

interface CategoryWebsitesListProps {
  initialWebsites: WebsiteMetadata[];
  slots: {
    WebsitesListWithSort: ComponentType<WebsitesListWithSortProps>;
  };
}

export function CategoryWebsitesList({
  initialWebsites,
  slots,
}: CategoryWebsitesListProps) {
  const { WebsitesListWithSort } = slots;

  return (
    <WebsitesListWithSort
      initialWebsites={initialWebsites}
      emptyTitle={siteCopy.categoryEmptyTitle}
      emptyDescription={siteCopy.categoryEmptyDescription}
    />
  );
}
