import type { ComponentType, ReactNode } from 'react'
import type { WebsiteMetadata } from '../content-query'
import { getRoute } from '../routes'

type SectionProps = {
  title: string
  description?: string
  children: ReactNode
  viewAllHref?: string
  viewAllText?: string
  titleId?: string
}

type LLMGridProps = {
  items: WebsiteMetadata[]
}

interface FeaturedProjectsSectionProps {
  projects: WebsiteMetadata[]
  slots: {
    LLMGrid: ComponentType<LLMGridProps>
    Section: ComponentType<SectionProps>
  }
}

export function FeaturedProjectsSection({
  projects,
  slots: { LLMGrid, Section },
}: FeaturedProjectsSectionProps) {
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
