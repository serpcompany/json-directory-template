import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GuideHeader } from '@/components/guide-header'
import { JsonLd } from '@/components/json-ld'
import { components } from '@/components/mdx'
import { type GuideMetadata, getGuideBySlug, getGuides } from '@/lib/content-loader'
import {
  GuideDetailPage,
  generateGuideDetailMetadata,
  generateGuideDetailStaticParams,
} from '@thedaviddias/web-core/guides/guide-page'
import { getRoute } from '@thedaviddias/web-core/routes'
import {
  generateDisabledRouteMetadata,
  isRouteFeatureEnabled,
  requireRouteFeature
} from '@/lib/route-feature-gates'
import { generateGuideSchema } from '@thedaviddias/web-core/schema'
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

  return generateGuideDetailMetadata(guide)
}

/**
 * Generates static params for all guide pages
 */
export async function generateStaticParams(): Promise<Awaited<GuidePageProps['params']>[]> {
  if (!siteConfig.features.showGuides) {
    return []
  }

  const guides = await getGuides()

  return generateGuideDetailStaticParams(guides)
}

export default async function GuidePage({ params }: GuidePageProps) {
  requireRouteFeature('showGuides')

  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  return (
    <GuideDetailPage
      guide={guide}
      guideHeader={<GuideHeader {...guide} />}
      jsonLd={<JsonLd data={generateGuideSchema(guide)} />}
      mdxComponents={components}
      slug={slug}
    />
  )
}
