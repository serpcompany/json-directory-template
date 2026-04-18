import type { WebsiteMetadata } from '@/lib/content-loader'
import { Section } from '@thedaviddias/web-core/layout/section'
import { FeaturedProjectsSection as PackageFeaturedProjectsSection } from '@thedaviddias/web-core/sections/featured-projects-section'
import { LLMGrid } from '@/components/llm/llm-grid'

interface FeaturedProjectsSectionProps {
  projects: WebsiteMetadata[]
}

export function FeaturedProjectsSection({ projects }: FeaturedProjectsSectionProps) {
  return (
    <PackageFeaturedProjectsSection
      projects={projects}
      slots={{ LLMGrid, Section }}
    />
  )
}
