import type { WebsiteMetadata } from '../content-query'
import { Section } from '../layout/section'
import { LLMGrid } from '../llm/llm-grid'
import { FeaturedProjectsSection as SharedFeaturedProjectsSection } from './featured-projects-section'

interface FeaturedProjectsSectionRouteProps {
  projects: WebsiteMetadata[]
}

export function FeaturedProjectsSectionRoute({
  projects,
}: FeaturedProjectsSectionRouteProps) {
  return (
    <SharedFeaturedProjectsSection
      projects={projects}
      slots={{ LLMGrid, Section }}
    />
  )
}
