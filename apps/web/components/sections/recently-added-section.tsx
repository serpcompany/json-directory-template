import type { WebsiteMetadata } from '@/lib/content-loader'
import { RecentlyAddedSection as PackageRecentlyAddedSection } from '@thedaviddias/web-core/sections/recently-added-section'
import { Section } from '@/components/layout/section'
import { LLMGrid } from '@/components/llm/llm-grid'

interface RecentlyAddedSectionProps {
  websites: WebsiteMetadata[]
  maxItems?: number
}

export function RecentlyAddedSection({ websites, maxItems = 8 }: RecentlyAddedSectionProps) {
  return (
    <PackageRecentlyAddedSection
      websites={websites}
      maxItems={maxItems}
      slots={{ LLMGrid, Section }}
    />
  )
}
