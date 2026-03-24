import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { components } from '@/components/mdx'
import { type DocMetadata, getDocBySlug, getDocs } from '@/lib/content-loader'
import { getRoute } from '@/lib/routes'
import { SITE_PUBLIC_URL, generateDynamicMetadata } from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'

interface DocPageProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * Generates metadata for a doc page
 */
export async function generateMetadata(props: DocPageProps): Promise<Metadata> {
  const { slug } = await props.params
  const doc = await getDocBySlug(slug)

  if (!doc) {
    return {}
  }

  return generateDynamicMetadata({
    type: 'doc',
    name: doc.title,
    description: doc.description,
    slug: doc.slug,
    additionalKeywords: ['documentation', 'reference', 'workflow notes']
  })
}

/**
 * Generates static params for all doc pages (excluding getting-started which is the index)
 */
export async function generateStaticParams(): Promise<Awaited<DocPageProps['params']>[]> {
  const docs = getDocs()

  return docs
    .filter((doc: DocMetadata) => doc.slug !== 'getting-started')
    .map((doc: DocMetadata) => ({
      slug: doc.slug
    }))
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params
  const doc = await getDocBySlug(slug)

  if (!doc) {
    notFound()
  }

  const breadcrumbItems = [
    { name: siteCopy.docsLabel, href: getRoute('docs.list') },
    { name: doc.title, href: getRoute('docs.doc', { slug }) }
  ]

  return (
    <article>
      <Breadcrumb items={breadcrumbItems} baseUrl={SITE_PUBLIC_URL} />
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
