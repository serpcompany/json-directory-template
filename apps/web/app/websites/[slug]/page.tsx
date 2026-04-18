import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { ProjectNavigation } from '@/components/project-navigation';
import { ExternalResourcesSection } from '@/components/sections/external-resources-section';
import { WebsiteContentSection } from '@/components/website/website-content-section';
import { WebsiteDetailSidebar } from '@/components/website/website-detail-sidebar';
import { WebsiteError } from '@/components/website/website-error';
import { WebsiteHero } from '@/components/website/website-hero';
import { WebsiteRelatedProjects } from '@/components/website/website-related-projects';
import { WebsiteResourcesSection } from '@/components/website/website-resources-section';
import {
  generateWebsiteDetailRouteMetadata,
  generateWebsiteDetailRouteStaticParams,
  WebsiteDetailRoutePage,
} from '@thedaviddias/web-core/website-routes/detail-page';
import {
  getWebsiteBySlug,
  getWebsites,
} from '@/lib/content-loader';
import { siteCopy } from '@thedaviddias/web-core/site-copy';
import { SITE_NAME } from '@thedaviddias/web-core/seo-config';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates metadata for the website page
 *
 * @param params - Page parameters containing the website slug
 * @returns Promise<Metadata> - Generated metadata for the page
 */
export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const project = await getWebsiteBySlug(slug);

    if (!project) {
      return {};
    }

    return generateWebsiteDetailRouteMetadata(project);
  } catch (_error) {
    return {
      title: `${siteCopy.listingName.singularTitle} | ${SITE_NAME}`,
      description: siteCopy.listingName.singularTitle,
    };
  }
}

/**
 * Generates static parameters for all website pages
 *
 * @returns Promise<Array<{ slug: string }>> - Array of website slugs for static generation
 */
export async function generateStaticParams() {
  try {
    return generateWebsiteDetailRouteStaticParams(await getWebsites());
  } catch (_error) {
    return [];
  }
}

/**
 * Website detail page component
 *
 * @param params - Page parameters containing the website slug
 * @returns Promise<JSX.Element> - Rendered website page
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    const { slug } = await params;

    const project = await getWebsiteBySlug(slug);

    if (!project) {
      notFound();
    }

    return (
      <WebsiteDetailRoutePage
        project={project}
        slots={{
          ExternalResourcesSection,
          JsonLd,
          ProjectNavigation,
          WebsiteContentSection,
          WebsiteDetailSidebar,
          WebsiteHero,
          WebsiteRelatedProjects,
          WebsiteResourcesSection,
        }}
      />
    );
  } catch (_error) {
    return <WebsiteError />;
  }
}
