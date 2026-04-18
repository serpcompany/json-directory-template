'use client';

import { ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';
import { FavoritesLink } from '../ui/favorites-link';
import { getCategoryDisplayName } from '../category-display';
import { categories } from '../categories';
import { externalResources } from '../external-resources';
import { getRoute } from '../routes';
import { siteConfig } from '../site-config';

export interface AppSidebarProps {
  availableCategorySlugs?: string[];
  currentCategory?: string;
  featuredCount?: number;
  showFeaturedCategory?: boolean;
}

export function AppSidebar({
  availableCategorySlugs,
  currentCategory,
  featuredCount = 0,
  showFeaturedCategory = featuredCount > 0,
}: AppSidebarProps) {
  const showExternalResources =
    siteConfig.features.showExternalResources && externalResources.length > 0;
  const availableCategories = availableCategorySlugs
    ? categories.filter((category) =>
        availableCategorySlugs.includes(category.slug)
      )
    : categories;

  return (
    <div className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[240px] max-w-[240px] min-w-[240px] overflow-y-auto border-r sm:block">
      <div className="space-y-6 p-4">
        <h2 className="sr-only">Navigation</h2>

        {siteConfig.features.showFavorites ? (
          <div>
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground">
              My Collection
            </h3>
            <nav className="space-y-1">
              <FavoritesLink />
            </nav>
          </div>
        ) : null}

        <div>
          <h3 className="font-semibold text-sm mb-4 text-muted-foreground">
            Categories
          </h3>
          <nav className="space-y-1">
            {showFeaturedCategory ? (
              <Link
                href={getRoute('category.page', { category: 'featured' })}
                className="flex items-center justify-between gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Featured
                </div>
                {featuredCount > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {featuredCount}
                  </span>
                )}
              </Link>
            ) : null}
            {availableCategories.map((category) => (
              <Link
                key={category.slug}
                href={getRoute('category.page', { category: category.slug })}
                className={`flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors ${
                  category.slug === currentCategory
                    ? 'text-foreground font-medium bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <category.icon className="h-4 w-4" />
                {getCategoryDisplayName(category.slug)}
              </Link>
            ))}
          </nav>
        </div>

        {showExternalResources ? (
          <div>
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground">
              Resources
            </h3>
            <nav className="space-y-1">
              {externalResources.map((resource) => (
                <Link
                  key={resource.slug}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <resource.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{resource.name}</span>
                  </div>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  );
}
