import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { GuideCard } from '@/components/guide-card'
import { Section } from '@/components/section'
import { ToolCard } from '@/components/tool-card'
import { WebsiteGrid } from '@/components/website-grid'
import { getFeaturedWebsites, getGuides, getTools } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Featured AI-Ready Websites',
  description:
    'Discover our curated selection of featured AI-ready websites and tools implementing the llms.txt standard.'
}

export default function FeaturedPage() {
  const featuredWebsites = getFeaturedWebsites()
  const guides = getGuides()
  const tools = getTools()

  return (
    <div className="border-t border-border/50">
      <div className="relative flex w-full flex-row">
        <AppSidebar featuredCount={featuredWebsites.length} />

        <div className="container-shell flex w-full flex-col gap-8 pt-6 pb-16">
          <section className="section-shell space-y-6">
            <div className="section-sticky">
              <div className="flex items-center gap-3">
                <Sparkles className="size-6" />
                <h1 className="text-2xl font-bold tracking-tight">Featured Websites & Tools</h1>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-[15px]">
                A curated selection of the strongest examples from the directory.
              </p>
            </div>

            <WebsiteGrid websites={featuredWebsites} />
          </section>

          <Section title="Developer Tools" titleId="featured-tools">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {tools.map(tool => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </Section>

          <Section title="Featured Guides" titleId="featured-guides-list">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {guides.map(guide => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}