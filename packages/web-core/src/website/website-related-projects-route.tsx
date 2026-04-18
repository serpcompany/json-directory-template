import type { WebsiteMetadata } from '../content-query'
import { LLMGrid } from '../llm/llm-grid'
import { Section } from '../layout/section'
import { WebsiteRelatedProjects as SharedWebsiteRelatedProjects } from './website-related-projects'

interface WebsiteRelatedProjectsRouteProps {
  websites: WebsiteMetadata[]
}

export function WebsiteRelatedProjectsRoute({
  websites,
}: WebsiteRelatedProjectsRouteProps) {
  return (
    <SharedWebsiteRelatedProjects
      websites={websites}
      slots={{ LLMGrid, Section }}
    />
  )
}
