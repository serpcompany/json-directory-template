import { ExternalLink, Home as HomeIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchResults } from '@/components/search/search-results';
import { getActiveCategories } from '@thedaviddias/web-core/category-navigation';
import { getCategoryDisplayName } from '@thedaviddias/web-core/category-display';
import { getWebsites } from '@/lib/content-loader';
import { externalResources } from '@thedaviddias/web-core/external-resources';
import { getRoute } from '@thedaviddias/web-core/routes';
import { generateBaseMetadata } from '@thedaviddias/web-core/seo-config';
import { siteCopy } from '@thedaviddias/web-core/site-copy';
import { siteConfig } from '@thedaviddias/web-core/site-config';

/**
 * Generate metadata for the static search shell.
 * @returns Promise resolving to Next.js Metadata object
 */
export async function generateMetadata(): Promise<Metadata> {
  const showExternalResources =
    siteConfig.features.showExternalResources && externalResources.length > 0;

  return generateBaseMetadata({
    title: 'Search',
    description: showExternalResources
      ? `Search for listings and external resources in ${siteConfig.name}.`
      : `Search for listings and resources in ${siteConfig.name}.`,
    path: '/search',
    keywords: showExternalResources
      ? [
          'search',
          'find',
          'directory listings',
          'external resources',
          'resources',
        ]
      : ['search', 'find', 'directory listings', 'resources'],
    noindex: true,
  });
}

export default function SearchPage() {
  const showExternalResources =
    siteConfig.features.showExternalResources && externalResources.length > 0;
  const activeCategories = getActiveCategories(getWebsites());

  return (
    <div className="border-t">
      <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
        <div className="sticky top-16 hidden w-[240px] max-w-[240px] min-w-[240px] overflow-hidden sm:block h-screen border-r">
          <div className="p-4 space-y-6">
            {/* Search filters navigation with proper heading hierarchy */}
            <h2 className="sr-only">Search Filters</h2>

            <div>
              <h3 className="font-semibold text-sm mb-4 text-muted-foreground">
                Categories
              </h3>
              <nav className="space-y-1">
                <Link
                  href={getRoute('home')}
                  className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  <HomeIcon className="h-4 w-4" />
                  {siteCopy.allLabel}
                </Link>
                {activeCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={getRoute('category.page', {
                      category: category.slug,
                    })}
                    className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
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

        <div className="relative flex h-full w-full flex-col gap-3 px-6 pt-6">
          <section className="space-y-6">
            <div className="sticky top-16 z-35 bg-background border-b py-4 -mx-6 px-6">
              <h1 className="text-2xl font-bold">Search</h1>
              <p className="text-muted-foreground mt-1">
                {showExternalResources
                  ? `Searching across all ${siteCopy.listingName.plural} and resources`
                  : `Searching across all ${siteCopy.listingName.plural}`}
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
                </div>
              }
            >
              <SearchResults />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
