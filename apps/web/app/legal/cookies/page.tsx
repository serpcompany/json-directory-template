import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { components } from '@/components/mdx'
import { getLegalContent } from '@/lib/content-loader'
import { SITE_NAME, SITE_PUBLIC_URL, generateBaseMetadata } from '@/lib/seo/seo-config'

export const metadata: Metadata = generateBaseMetadata({
  title: 'Cookie Policy',
  description: `Cookie policy for ${SITE_NAME}. Learn how we use cookies and similar technologies.`,
  path: '/legal/cookies',
  noindex: true
})

export default async function CookiePolicyPage() {
  const breadcrumbItems = [{ name: 'Cookie Policy', href: '/legal/cookies' }]
  const source = await getLegalContent('cookies')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} baseUrl={SITE_PUBLIC_URL} />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4 pb-8 border-b">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Cookie Policy</h1>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote
            source={source}
            components={components}
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
