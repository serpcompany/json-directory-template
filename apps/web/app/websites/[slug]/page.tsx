import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { ProjectNavigation } from '@/components/project-navigation'
import { ExternalResourcesSection } from '@/components/sections/external-resources-section'
import { WebsiteContentSection } from '@/components/website/website-content-section'
import { WebsiteDetailSidebar } from '@/components/website/website-detail-sidebar'
import { WebsiteError } from '@/components/website/website-error'
import { WebsiteHero } from '@/components/website/website-hero'
import { WebsiteRelatedProjects } from '@/components/website/website-related-projects'
import { WebsiteResourcesSection } from '@/components/website/website-resources-section'
import { getWebsiteBySlug, getWebsites, type WebsiteMetadata } from '@/lib/content-loader'
import { getRoute } from '@/lib/routes'
import { generateWebsiteDetailSchema } from '@/lib/schema'
import { SITE_NAME, generateDynamicMetadata } from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'
import { siteConfig } from '@/lib/site-config'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Generates metadata for the website page
 *
 * @param params - Page parameters containing the website slug
 * @returns Promise<Metadata> - Generated metadata for the page
 */
export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const project = await getWebsiteBySlug(slug)

    if (!project) {
      return {}
    }

    // Format category for display
    const categoryFormatted = project.category
      ? project.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : null

    // Create an SEO-optimized description
    const seoDescription = `${project.description} Explore ${project.name} in the ${siteConfig.name} directory, with resource links, category details, and related entries.${categoryFormatted ? ` Category: ${categoryFormatted}.` : ''}`

    // Generate comprehensive keywords
    const keywords = [
      project.name,
      `${project.name} ${siteCopy.listingName.singular}`,
      `${project.name} resources`,
      project.category,
      `${siteCopy.listingName.singular} details`,
      'directory listings',
      'resource links',
      categoryFormatted
    ].filter(Boolean) as string[]

    return generateDynamicMetadata({
      type: 'listing',
      name: project.name,
      description: seoDescription.length > 160 ? project.description : seoDescription,
      slug: project.slug,
      additionalKeywords: keywords,
      publishedAt: project.publishedAt
    })
  } catch (_error) {
    return {
      title: `${siteCopy.listingName.singularTitle} | ${SITE_NAME}`,
      description: siteCopy.listingName.singularTitle
    }
  }
}

/**
 * Generates static parameters for all website pages
 *
 * @returns Promise<Array<{ slug: string }>> - Array of website slugs for static generation
 */
export async function generateStaticParams() {
  try {
    const websites = await getWebsites()

    if (!websites || websites.length === 0) {
      return []
    }

    // Only include websites with valid string slugs
    const params = websites
      .filter((website: WebsiteMetadata) => website.slug && typeof website.slug === 'string')
      .map((website: WebsiteMetadata) => ({
        slug: website.slug
      }))

    return params
  } catch (_error) {
    return []
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
    const { slug } = await params

    const project = await getWebsiteBySlug(slug)

    if (!project) {
      notFound()
    }

    const breadcrumbItems = [
      { name: 'Directory', href: getRoute('listing.list') },
      { name: project.name, href: getRoute('listing.detail', { slug: project.slug }) }
    ]

    return (
      <div className="min-h-screen">
        <JsonLd data={generateWebsiteDetailSchema(project)} />

        {/* Hero Section */}
        <WebsiteHero website={project} breadcrumbItems={breadcrumbItems} />

        {/* Main Content Area */}
        <div className="container mx-auto px-6 py-10 md:py-14">
          <div className="max-w-6xl mx-auto">
            {/* Two-column grid: content + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Main content column */}
              <div className="lg:col-span-8 space-y-14 md:space-y-16">
                {/* Supplemental resources */}
                <WebsiteResourcesSection website={project} />

                {/* Content Section */}
                <WebsiteContentSection website={project} />

                {/* External resources section */}
                {siteConfig.features.showExternalResources && (
                  <section className="animate-fade-in-up opacity-0 stagger-5">
                    <ExternalResourcesSection layout="default" showImages={false} />
                  </section>
                )}
              </div>

              {/* Sidebar column */}
              <div className="lg:col-span-4">
                <WebsiteDetailSidebar website={project} />
              </div>
            </div>

            {/* Full-width sections below the grid */}
            <div className="mt-14 md:mt-16 space-y-14 md:space-y-16">
              {/* Navigation */}
              <section
                className="animate-fade-in-up opacity-0 stagger-6"
                aria-labelledby="browse-more-heading"
              >
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8">
                  <h2
                    id="browse-more-heading"
                    className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4"
                  >
                    Browse more
                  </h2>
                  <ProjectNavigation
                    previousWebsite={project.previousWebsite}
                    nextWebsite={project.nextWebsite}
                  />
                </div>
              </section>

              {/* Related Projects */}
              {project.relatedWebsites?.length > 0 && (
                <WebsiteRelatedProjects websites={project.relatedWebsites} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (_error) {
    return <WebsiteError />
  }
}
