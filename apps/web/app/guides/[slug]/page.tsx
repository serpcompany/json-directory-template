import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { GuideHeader } from '@/components/guide-header'
import { JsonLd } from '@/components/json-ld'
import { components } from '@/components/mdx'
import { type GuideMetadata, getGuideBySlug, getGuides } from '@/lib/content-loader'
import { getRoute } from '@thedaviddias/web-core/routes'
import {
  generateDisabledRouteMetadata,
  isRouteFeatureEnabled,
  requireRouteFeature
} from '@/lib/route-feature-gates'
import { generateGuideSchema } from '@thedaviddias/web-core/schema'
import { SITE_PUBLIC_URL, generateDynamicMetadata } from '@thedaviddias/web-core/seo-config'
import { siteConfig } from '@thedaviddias/web-core/site-config'

interface GuidePageProps {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = false

/**
 * Generates metadata for a guide page
 */
export async function generateMetadata(props: GuidePageProps): Promise<Metadata> {
  if (!isRouteFeatureEnabled('showGuides')) {
    return generateDisabledRouteMetadata()
  }

  const { slug } = await props.params
  const guide = await getGuideBySlug(slug)

  if (!guide) {
    return {}
  }

  return generateDynamicMetadata({
    type: 'guide',
    name: guide.title,
    description: guide.description || `Learn about ${guide.title} in our comprehensive guide`,
    slug: guide.slug,
    publishedAt: guide.date,
    additionalKeywords: ['guide', 'tutorial', 'how-to', 'implementation']
  })
}

/**
 * Generates static params for all guide pages
 */
export async function generateStaticParams(): Promise<Awaited<GuidePageProps['params']>[]> {
  if (!siteConfig.features.showGuides) {
    return []
  }

  const guides = await getGuides()

  return guides.map((guide: GuideMetadata) => ({
    slug: guide.slug
  }))
}

export default async function GuidePage({ params }: GuidePageProps) {
  requireRouteFeature('showGuides')

  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  const breadcrumbItems = [
    { name: 'Posts', href: getRoute('guides.list') },
    { name: guide.title, href: getRoute('guides.guide', { slug }) }
  ]

  return (
    <article className="container relative max-w-3xl py-6 lg:py-10">
      <JsonLd data={generateGuideSchema(guide)} />
      <Breadcrumb items={breadcrumbItems} baseUrl={SITE_PUBLIC_URL} />
      <GuideHeader {...guide} />
      <div className="prose dark:prose-invert max-w-none">
        <MDXRemote
          source={guide.content || ''}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm]
            }
          }}
        />
      </div>
    </article>
  )
}
