import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import { Trophy } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getHomePageData } from '@/actions/get-home-page-data';
import { CategoryWebsitesList } from '@/components/category-websites-list';
import { JsonLd } from '@/components/json-ld';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FeaturedGuidesSection } from '@/components/sections/featured-guides-section';
import { NewsletterSection } from '@/components/sections/newsletter-section';
import { ExternalResourcesSection } from '@/components/sections/external-resources-section';
import {
  FeaturedCategoryRoutePage,
  featuredCategoryPageMetadata,
} from '@thedaviddias/web-core/category-routes/featured-page';
import {
  getActiveCategories,
  getFeaturedListingCount,
} from '@thedaviddias/web-core/category-navigation';
import { getGuides } from '@/lib/content-loader';
import { getRoute } from '@thedaviddias/web-core/routes';
import { SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config';

export const metadata = featuredCategoryPageMetadata;

export default async function FeaturedPage() {
  const { allProjects, featuredProjects } = await getHomePageData();
  const featuredGuides = await getGuides();
  const featuredPath = getRoute('category.page', { category: 'featured' });
  const activeCategories = getActiveCategories(allProjects);
  const activeCategorySlugs = activeCategories.map((category) => category.slug);

  if (getFeaturedListingCount(featuredProjects) === 0) {
    notFound();
  }

  return (
    <FeaturedCategoryRoutePage
      activeCategorySlugs={activeCategorySlugs}
      featuredGuides={featuredGuides}
      featuredProjects={featuredProjects}
      slots={{
        AppSidebar,
        CategoryWebsitesList,
        ExternalResourcesSection,
        FeaturedGuidesSection,
        JsonLd,
        NewsletterSection,
        breadcrumb: (
          <Breadcrumb
            items={[{ name: 'Featured', href: featuredPath }]}
            baseUrl={SITE_PUBLIC_URL}
          />
        ),
        headingIcon: <Trophy className="h-6 w-6 text-yellow-500" />,
      }}
    />
  );
}
