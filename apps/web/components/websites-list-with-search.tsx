'use client';

import { useAnalyticsEvents } from '@/components/analytics-tracker';
import { EmptyState } from '@/components/empty-state';
import { LLMGrid } from '@/components/llm/llm-grid';
import { WebsitesSearchControls } from '@/components/websites-search-controls';
import { useFavoritesFilter } from '@/hooks/use-favorites-filter';
import type { WebsiteMetadata } from '@/lib/content-loader';
import { WebsitesListWithSearch as SharedWebsitesListWithSearch } from '@thedaviddias/web-core/websites-list-with-search';

interface WebsitesListWithSearchProps {
  initialWebsites: WebsiteMetadata[];
  emptyTitle?: string;
  emptyDescription?: string;
  initialShowFavoritesOnly?: boolean;
  totalCount?: number;
  displayLimit?: number;
}

export function WebsitesListWithSearch(
  props: WebsitesListWithSearchProps
) {
  const analytics = useAnalyticsEvents();
  const favorites = useFavoritesFilter(props.initialWebsites);

  return (
    <SharedWebsitesListWithSearch
      {...props}
      analytics={analytics}
      favorites={favorites}
      slots={{
        EmptyState,
        LLMGrid,
        WebsitesSearchControls,
      }}
    />
  );
}
