import { Section } from '@/components/layout/section'
import { LLMGrid } from '@/components/llm/llm-grid'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { siteConfig } from '@/lib/site-config'

interface RecentlyAddedSectionProps {
  websites: WebsiteMetadata[]
  maxItems?: number
}

export function RecentlyAddedSection({ websites, maxItems = 8 }: RecentlyAddedSectionProps) {
  if (!websites || websites.length === 0) {
    return null
  }

  // Take only the most recent items
  const recentWebsites = websites.slice(0, maxItems)

  return (
    <Section
      title="Recently Added"
      description={`See the newest entries added to ${siteConfig.name}`}
    >
      <LLMGrid
        items={recentWebsites}
        variant="default"
        animateIn={true}
        analyticsSource="recently-added"
      />
    </Section>
  )
}
