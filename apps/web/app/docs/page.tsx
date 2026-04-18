import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { components } from '@/components/mdx'
import { getDocBySlug } from '@/lib/content-loader'
import { getRoute } from '@thedaviddias/web-core/routes'
import {
  generateDisabledRouteMetadata,
  isRouteFeatureEnabled,
  requireRouteFeature
} from '@/lib/route-feature-gates'
import { SITE_PUBLIC_URL, generateBaseMetadata } from '@thedaviddias/web-core/seo-config'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { siteConfig } from '@thedaviddias/web-core/site-config'

export function generateMetadata(): Metadata {
  if (!isRouteFeatureEnabled('showDocs')) {
    return generateDisabledRouteMetadata()
  }

  return generateBaseMetadata({
    title: `${siteCopy.docsLabel} - ${siteConfig.name}`,
    description: `Reference docs, setup notes, and workflow details for ${siteConfig.name}.`,
    path: getRoute('docs.list'),
    keywords: [
      'documentation',
      'setup notes',
      'workflow reference',
      'starter docs',
      `${siteConfig.name} documentation`
    ]
  })
}

export default async function DocsPage() {
  requireRouteFeature('showDocs')

  const doc = await getDocBySlug('getting-started')

  if (!doc) {
    notFound()
  }

  return (
    <article>
      <Breadcrumb
        items={[{ name: siteCopy.docsLabel, href: getRoute('docs.list') }]}
        baseUrl={SITE_PUBLIC_URL}
      />
      <div className="space-y-2 mt-6 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{doc.title}</h1>
        <p className="text-lg text-muted-foreground">{doc.description}</p>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <MDXRemote
          source={doc.content || ''}
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
