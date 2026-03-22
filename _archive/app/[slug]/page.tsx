import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { GuideCard } from '@/components/guide-card'
import { Section } from '@/components/section'
import { ToolCard } from '@/components/tool-card'
import { WebsiteGrid } from '@/components/website-grid'
import { getCategoryBySlug, getCategories, getFeaturedWebsites, getGuides, getTools, getWebsitesByCategory } from '@/lib/data'
import { getCategoryMeta } from '@/lib/site'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getCategories().map(category => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category Not Found'
    }
  }

  return {
    title: category.name,
    description: category.description
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const websites = getWebsitesByCategory(slug)
  const guides = getGuides()
  const tools = getTools()
  const featuredCount = getFeaturedWebsites().length
  const meta = getCategoryMeta(slug)
  const Icon = meta.icon

  return (
    <div className="border-t border-border/50">
      <div className="relative flex w-full flex-row">
        <AppSidebar currentCategory={slug} featuredCount={featuredCount} />

        <div className="container-shell flex w-full flex-col gap-8 pt-6 pb-16">
          <section className="section-shell space-y-6">
            <div className="section-sticky">
              <div className="flex items-center gap-3">
                <Icon className="size-6" />
                <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-[15px]">{category.intro}</p>
            </div>

            <WebsiteGrid websites={websites} />
          </section>

          <Section
            description="Explore tools created to help you work with llms.txt."
            title="Developer Tools"
            titleId="category-tools"
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {tools.map(tool => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </Section>

          <Section
            description="Learn how to implement and optimize llms.txt for your documentation."
            title="Featured Guides"
            titleId="category-guides"
          >
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