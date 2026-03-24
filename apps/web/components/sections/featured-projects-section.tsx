import { Section } from '@/components/layout/section'
import { LLMGrid } from '@/components/llm/llm-grid'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { getRoute } from '@/lib/routes'

interface FeaturedProjectsSectionProps {
  projects: WebsiteMetadata[]
}

export function FeaturedProjectsSection({ projects }: FeaturedProjectsSectionProps) {
  // Projects are already filtered and limited to 8 featured items
  // Shows 6 on smaller screens, 8 on 4xl+ (handled via CSS in LLMGrid)
  return (
    <Section
      title="Featured Listings"
      description="Discover standout listings from this directory"
      viewAllHref={getRoute('category.page', { category: 'featured' })}
      viewAllText="All featured"
    >
      {projects.length > 0 && <LLMGrid items={projects} />}
    </Section>
  )
}
