import { Section } from '@thedaviddias/web-core/layout/section'
import { FeaturedGuidesSection as PackageFeaturedGuidesSection } from '@thedaviddias/web-core/sections/featured-guides-section'
import type { GuideMetadata } from '@/lib/content-loader'
import { GuideCard } from './guide-card'

interface FeaturedGuidesSectionProps {
  guides: GuideMetadata[]
}

/**
 * Section component displaying featured guides
 *
 * @param props - Component props
 * @param props.guides - List of guides to display
 * @returns React component
 */
export function FeaturedGuidesSection({ guides }: FeaturedGuidesSectionProps) {
  return (
    <PackageFeaturedGuidesSection
      guides={guides}
      slots={{ GuideCard, Section }}
    />
  )
}
