import { notFound } from 'next/navigation'
import { components } from '@/components/mdx'
import { getDocBySlug } from '@/lib/content-loader'
import {
  DocsIndexPage,
  generateDocsIndexMetadata,
} from '@thedaviddias/web-core/docs/index-page'
import {
  generateDisabledRouteMetadata,
  isRouteFeatureEnabled,
  requireRouteFeature
} from '@/lib/route-feature-gates'
import type { Metadata as NextMetadata } from 'next'

export function generateMetadata(): NextMetadata {
  if (!isRouteFeatureEnabled('showDocs')) {
    return generateDisabledRouteMetadata()
  }

  return generateDocsIndexMetadata()
}

export default async function DocsPage() {
  requireRouteFeature('showDocs')

  const doc = await getDocBySlug('getting-started')

  if (!doc) {
    notFound()
  }

  return <DocsIndexPage doc={doc} mdxComponents={components} />
}
