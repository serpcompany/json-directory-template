import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { components } from '@/components/mdx'
import { getDocBySlug, getDocs } from '@/lib/content-loader'
import {
  DocDetailPage,
  generateDocDetailMetadata,
  generateDocDetailStaticParams,
} from '@thedaviddias/web-core/docs/doc-page'
import {
  generateDisabledRouteMetadata,
  isRouteFeatureEnabled,
  requireRouteFeature
} from '@/lib/route-feature-gates'
import { siteConfig } from '@thedaviddias/web-core/site-config'

interface DocPageProps {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = false

/**
 * Generates metadata for a doc page
 */
export async function generateMetadata(props: DocPageProps): Promise<Metadata> {
  if (!isRouteFeatureEnabled('showDocs')) {
    return generateDisabledRouteMetadata()
  }

  const { slug } = await props.params
  const doc = await getDocBySlug(slug)

  if (!doc) {
    return {}
  }

  return generateDocDetailMetadata(doc)
}

/**
 * Generates static params for all doc pages (excluding getting-started which is the index)
 */
export async function generateStaticParams(): Promise<Awaited<DocPageProps['params']>[]> {
  if (!siteConfig.features.showDocs) {
    return []
  }

  return generateDocDetailStaticParams(getDocs())
}

export default async function DocPage({ params }: DocPageProps) {
  requireRouteFeature('showDocs')

  const { slug } = await params
  const doc = await getDocBySlug(slug)

  if (!doc) {
    notFound()
  }

  return <DocDetailPage doc={doc} mdxComponents={components} slug={slug} />
}
