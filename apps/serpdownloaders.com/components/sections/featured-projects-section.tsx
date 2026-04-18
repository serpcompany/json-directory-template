import type { WebsiteMetadata } from '@/lib/content-loader'
import { FeaturedProjectsSection as PackageFeaturedProjectsSection } from '@thedaviddias/web-core/sections/featured-projects-section'
import { Section } from '@/components/layout/section'
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
