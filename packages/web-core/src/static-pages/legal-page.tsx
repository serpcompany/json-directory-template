import type { MDXComponents } from 'mdx/types'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import remarkGfm from 'remark-gfm'
import { SITE_NAME, SITE_PUBLIC_URL, generateBaseMetadata } from '../seo-config'

interface LegalStaticPageProps {
  content: string
  mdxComponents: MDXComponents
  path: string
  slots: {
    Breadcrumb: ComponentType<{
      baseUrl: string
      items: Array<{ href: string; name: string }>
    }>
  }
  title: string
}

export function generateLegalPageMetadata(options: {
  description: string
  path: string
  title: string
}): Metadata {
  return generateBaseMetadata({
    title: options.title,
    description: options.description.replace(/\{\{SITE_NAME\}\}/g, SITE_NAME),
    path: options.path,
    noindex: true
  })
}

export function LegalStaticPage({
  content,
  mdxComponents,
  path,
  slots,
  title
}: LegalStaticPageProps) {
  const { Breadcrumb } = slots

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[{ name: title, href: path }]} baseUrl={SITE_PUBLIC_URL} />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4 border-b pb-8">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {title}
          </h1>
        </div>
        <div className="prose max-w-none dark:prose-invert">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm]
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
