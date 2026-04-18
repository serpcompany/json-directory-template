import { Section } from '@thedaviddias/web-core/layout/section'
import { LLMGrid } from '@/components/llm/llm-grid'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { WebsiteRelatedProjects as SharedWebsiteRelatedProjects } from '@thedaviddias/web-core/website/website-related-projects'

interface WebsiteRelatedProjectsProps {
  websites: WebsiteMetadata[]
}

export function WebsiteRelatedProjects({ websites }: WebsiteRelatedProjectsProps) {
  return (
    <SharedWebsiteRelatedProjects
      websites={websites}
      slots={{ LLMGrid, Section }}
    />
  )
}
