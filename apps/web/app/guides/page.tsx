import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { EmptyState } from '@/components/empty-state'
import { JsonLd } from '@/components/json-ld'
import { GuideCard } from '@/components/sections/guide-card'
import { type GuideMetadata, getGuides } from '@/lib/content-loader'
import { getRoute } from '@/lib/routes'
import { generateGuideSchema } from '@/lib/schema'
import { SITE_PUBLIC_URL, generateBaseMetadata } from '@/lib/seo/seo-config'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = generateBaseMetadata({
  title: 'Posts',
  description: `Browse posts, walkthroughs, and reference notes for ${siteConfig.name}.`,
  path: getRoute('guides.list'),
  keywords: [
    'directory posts',
    'product walkthroughs',
    'reference notes',
    'blog posts',
    `${siteConfig.name} posts`
  ]
})

export default async function GuidesPage() {
  const guides = await getGuides()

  return (
    <div className="container mx-auto py-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': guides.map((guide: GuideMetadata) => generateGuideSchema(guide))
        }}
      />
      <div className="space-y-12">
        <Breadcrumb
          items={[{ name: 'Posts', href: getRoute('guides.list') }]}
          baseUrl={SITE_PUBLIC_URL}
        />

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <span className="size-2 bg-primary rounded-full" />
            Posts
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse posts, walkthroughs, and reference notes for this directory.
          </p>
        </div>

        {guides?.length ? (
          <section className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              All Posts ({guides.length})
            </h2>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {guides.map((guide: GuideMetadata, index: number) => (
                <GuideCard key={guide.slug} guide={guide} index={index} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            title="No posts yet"
            description="Posts will appear here when this site publishes them."
          />
        )}
      </div>
    </div>
  )
}
