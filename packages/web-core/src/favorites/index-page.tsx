import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import { Heart } from 'lucide-react';
import type { Metadata } from 'next';
import type { ComponentType, ReactNode } from 'react';
import { getActiveCategories } from '../category-navigation';
import type { GuideMetadata, WebsiteMetadata } from '../content-query';
import {
  SITE_NAME,
  SITE_PUBLIC_URL,
  generateBaseMetadata,
} from '../seo-config';
import { siteCopy } from '../site-copy';

type JsonLdProps = {
  data: Record<string, unknown>;
};

type AppSidebarProps = {
  availableCategorySlugs?: string[];
  featuredCount?: number;
};

type FeaturedGuidesSectionProps = {
  guides: GuideMetadata[];
};

type WebsitesListWithSearchProps = {
  initialShowFavoritesOnly?: boolean;
  initialWebsites: WebsiteMetadata[];
  totalCount: number;
};

type FavoritesPageSlots = {
  AppSidebar: ComponentType<AppSidebarProps>;
  FeaturedGuidesSection: ComponentType<FeaturedGuidesSectionProps>;
  JsonLd: (props: JsonLdProps) => ReactNode | Promise<ReactNode>;
  NewsletterSection: ComponentType;
  WebsitesListWithSearch: ComponentType<WebsitesListWithSearchProps>;
};

type FavoritesPageProps = {
  allProjects: WebsiteMetadata[];
  featuredGuides: GuideMetadata[];
  featuredProjects: WebsiteMetadata[];
  slots: FavoritesPageSlots;
  totalCount: number;
};

export const favoritesPageMetadata: Metadata = generateBaseMetadata({
  title: `Saved Favorites - ${SITE_NAME}`,
  description: `View and manage the ${siteCopy.listingName.plural} and related resources you have saved from the directory.`,
  keywords: [
    'favorites',
    `saved ${siteCopy.listingName.plural}`,
    'bookmarks',
    'directory listings',
    'resources',
  ],
  path: '/favorites',
});

export function FavoritesIndexPage({
  allProjects,
  featuredGuides,
  featuredProjects,
  slots,
  totalCount,
}: FavoritesPageProps) {
  const activeCategories = getActiveCategories(allProjects);
  const activeCategorySlugs = activeCategories.map((category) => category.slug);
  const {
    AppSidebar,
    FeaturedGuidesSection,
    JsonLd,
    NewsletterSection,
    WebsitesListWithSearch,
  } = slots;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Favorites - ${SITE_NAME}`,
          description: `Your saved ${siteCopy.listingName.plural}`,
          url: `${SITE_PUBLIC_URL}/favorites`,
        }}
      />

      <div className="border-t">
        <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
          <AppSidebar
            availableCategorySlugs={activeCategorySlugs}
            featuredCount={featuredProjects.length}
          />

          <div className="relative flex h-full w-full flex-col gap-3 px-6 pt-6 pb-16">
            <Breadcrumb
              items={[{ name: 'Favorites', href: '/favorites' }]}
              baseUrl={SITE_PUBLIC_URL}
            />

            <div className="mb-6">
              <div className="mb-3 flex items-center gap-3">
                <Heart className="h-8 w-8 fill-red-500 text-red-500" />
                <h1 className="text-3xl font-bold">Saved Favorites</h1>
              </div>
              <p className="text-muted-foreground">
                Your saved {siteCopy.listingName.plural} and related resources
                from the directory
              </p>
            </div>

            <WebsitesListWithSearch
              initialWebsites={allProjects}
              initialShowFavoritesOnly={true}
              totalCount={totalCount}
            />

            <div className="mt-12 space-y-8">
              <FeaturedGuidesSection guides={featuredGuides} />
              <NewsletterSection />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
