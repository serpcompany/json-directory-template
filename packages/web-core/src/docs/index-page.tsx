import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import type { DocMetadata } from '../content-query'
import { getRoute } from '../routes'
import { SITE_PUBLIC_URL, generateBaseMetadata } from '../seo-config'
import { siteCopy } from '../site-copy'
import { siteConfig } from '../site-config'

interface DocsIndexPageProps {
  doc: DocMetadata
  mdxComponents: Record<string, unknown>
}

export function generateDocsIndexMetadata(): Metadata {
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

export function DocsIndexPage({ doc, mdxComponents }: DocsIndexPageProps) {
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
          components={mdxComponents}
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
