import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import { getBaseUrl } from '@thedaviddias/utils/get-base-url'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { components } from '@/components/mdx'
import { getDocBySlug } from '@/lib/content-loader'
import { getRoute } from '@/lib/routes'
import { generateBaseMetadata } from '@/lib/seo/seo-config'

export const metadata: Metadata = generateBaseMetadata({
  title: 'Documentation - llms.txt hub',
  description:
    'Learn how to use llmstxt-cli, how the static starter submit flow works, and how local JSON and MDX data power the active directory.',
  path: '/docs',
  keywords: [
    'llmstxt-cli',
    'llms.txt CLI',
    'AI agent skills',
    'CLI documentation',
    'llms.txt install',
    'developer tools',
    'static starter',
    'json-first starter'
  ]
})

export default async function DocsPage() {
  const doc = await getDocBySlug('getting-started')

  if (!doc) {
    notFound()
  }

  return (
    <article>
      <Breadcrumb items={[{ name: 'Docs', href: getRoute('docs.list') }]} baseUrl={getBaseUrl()} />
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
