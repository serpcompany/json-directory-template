import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { components } from '@/components/mdx'
import { getDocBySlug } from '@/lib/content-loader'
import { getRoute } from '@/lib/routes'
import { SITE_NAME, SITE_PUBLIC_URL, generateBaseMetadata } from '@/lib/seo/seo-config'

export const metadata: Metadata = generateBaseMetadata({
  title: `Documentation - ${SITE_NAME}`,
  description: `Reference documentation, setup notes, and workflow details for ${SITE_NAME}.`,
  path: '/docs',
  keywords: [
    'documentation',
    'setup notes',
    'workflow reference',
    'starter docs',
    `${SITE_NAME} documentation`
  ]
})

export default async function DocsPage() {
  const doc = await getDocBySlug('getting-started')

  if (!doc) {
    notFound()
  }

  return (
    <article>
      <Breadcrumb items={[{ name: 'Docs', href: getRoute('docs.list') }]} baseUrl={SITE_PUBLIC_URL} />
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
