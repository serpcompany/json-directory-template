import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import { Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getHomePageData } from '@/actions/get-home-page-data';
import { CategoryWebsitesList } from '@/components/category-websites-list';
import { JsonLd } from '@/components/json-ld';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section';
import { NewsletterSection } from '@/components/sections/newsletter-section';
import { ExternalResourcesSection } from '@/components/sections/external-resources-section';
import {
  getActiveCategories,
  getFeaturedListingCount,
} from '@thedaviddias/web-core/category-navigation';
import { getGuides } from '@/lib/content-loader';
import { getRoute } from '@thedaviddias/web-core/routes';
import {
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_PUBLIC_URL,
  generateBaseMetadata,
} from '@thedaviddias/web-core/seo-config';
import { siteCopy } from '@thedaviddias/web-core/site-copy';
import { siteConfig } from '@thedaviddias/web-core/site-config';

export const metadata: Metadata = generateBaseMetadata({
  title: `Featured ${siteCopy.listingName.pluralTitle} - ${SITE_NAME}`,
  description: `Discover our curated selection of featured ${siteCopy.listingName.plural} and related resources.`,
  keywords: [
    'featured',
    'curated',
    `featured ${siteCopy.listingName.plural}`,
    'directory',
    'resources',
  ],
  path: getRoute('category.page', { category: 'featured' }),
});

export default async function FeaturedPage() {
  const { allProjects, featuredProjects } = await getHomePageData();
  const featuredGuides = await getGuides();
  const featuredPath = getRoute('category.page', { category: 'featured' });
  const featuredUrl = `${SITE_PUBLIC_URL}${featuredPath}`;
  const activeCategories = getActiveCategories(allProjects);
  const activeCategorySlugs = activeCategories.map((category) => category.slug);

  if (getFeaturedListingCount(featuredProjects) === 0) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': featuredUrl,
          name: `Featured - ${SITE_NAME}`,
          headline: `${featuredProjects.length}+ Featured ${siteCopy.listingName.pluralTitle}`,
          description: `Explore ${featuredProjects.length}+ curated featured ${siteCopy.listingName.plural} from ${SITE_NAME}. Hand-picked for quality and relevance.`,
          url: featuredUrl,
          inLanguage: 'en-US',
          isPartOf: {
            '@type': 'WebSite',
            '@id': SITE_PUBLIC_URL,
            name: SITE_NAME,
            description: siteConfig.description,
            url: SITE_PUBLIC_URL,
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_PUBLIC_URL,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Featured',
                item: featuredUrl,
              },
            ],
          },
          numberOfItems: featuredProjects.length,
          itemListElement: featuredProjects
            .slice(0, 10)
            .map((project, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: project.website,
              name: project.name,
              description: project.description,
            })),
          mainEntity: {
            '@type': 'ItemList',
            name: `Featured ${siteCopy.listingName.pluralTitle}`,
            description: `Curated selection of featured ${siteCopy.listingName.plural} and resources`,
            numberOfItems: featuredProjects.length,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            itemListElement: featuredProjects
              .slice(0, 20)
              .map((project, index) => ({
                '@type': 'Thing',
                position: index + 1,
                url: project.website,
                name: project.name,
              })),
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_PUBLIC_URL,
            logo: {
              '@type': 'ImageObject',
              url: SITE_LOGO_URL,
            },
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
        }}
      />

      <div className="border-t">
        <div className="relative flex h-full w-full max-w-full flex-row flex-nowrap">
          <AppSidebar
            availableCategorySlugs={activeCategorySlugs}
            featuredCount={featuredProjects.length}
          />

          <div className="relative flex h-full w-full flex-col gap-3 px-6 pt-6">
            {/* Breadcrumb Navigation */}
            <Breadcrumb
              items={[{ name: 'Featured', href: featuredPath }]}
              baseUrl={SITE_PUBLIC_URL}
            />

            {/* Featured Websites Section */}
            <section className="space-y-6">
              <div className="sticky top-16 z-35 bg-background border-b py-4 -mx-6 px-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h1 className="text-2xl font-bold">
                    Featured {siteCopy.listingName.pluralTitle}
                  </h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Curated listings highlighted for quality, usefulness, and
                  relevance
                </p>
              </div>
              <CategoryWebsitesList initialWebsites={featuredProjects} />
            </section>

            {siteConfig.features.showExternalResources && (
              <ExternalResourcesSection />
            )}
            {siteConfig.features.showFeaturedGuides && (
              <FeaturedGuidesSection guides={featuredGuides} />
            )}
            {siteConfig.features.showNewsletter && <NewsletterSection />}
          </div>
        </div>
      </div>
    </>
  );
}
