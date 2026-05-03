import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  generateWebsiteDetailRouteMetadata,
  generateWebsiteDetailRouteStaticParams,
  WebsiteDetailRoutePage,
} from '@thedaviddias/web-core/website-routes/detail-page'
import { getWebsiteBySlug, getWebsites } from '@/lib/content-loader'
import { JsonLd } from '@thedaviddias/web-core/json-ld'
import { ProjectNavigation } from '@thedaviddias/web-core/project-navigation'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { SITE_NAME } from '@thedaviddias/web-core/seo-config'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'
import { WebsiteContentSectionRoute as WebsiteContentSection } from '@thedaviddias/web-core/website/website-content-section-route'
import { WebsiteDetailSidebar } from '@thedaviddias/web-core/website/website-detail-sidebar'
import { WebsiteErrorRoute as WebsiteError } from '@thedaviddias/web-core/website/website-error-route'
import { WebsiteHeroRoute as WebsiteHero } from '@thedaviddias/web-core/website/website-hero-route'
import { WebsiteRelatedProjectsRoute as WebsiteRelatedProjects } from '@thedaviddias/web-core/website/website-related-projects-route'
import { WebsiteResourcesSectionRoute as WebsiteResourcesSection } from '@thedaviddias/web-core/website/website-resources-section-route'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const project = await getWebsiteBySlug(slug)

    if (!project) {
      return {}
    }

    return generateWebsiteDetailRouteMetadata(project)
  } catch {
    return {
      title: `${siteCopy.listingName.singularTitle} | ${SITE_NAME}`,
      description: siteCopy.listingName.singularTitle,
    }
  }
}

export async function generateStaticParams() {
  try {
    return generateWebsiteDetailRouteStaticParams(await getWebsites())
  } catch {
    return []
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { slug } = await params
    const project = await getWebsiteBySlug(slug)

    if (!project) {
      notFound()
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
    )
  } catch {
    return <WebsiteError />
  }
}
