import { ExternalResourcesSection as SharedExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section'
import { Section } from '@/components/layout/section'

interface ExternalResourcesSectionProps {
  layout?: 'default' | 'compact'
  showImages?: boolean
}

export function ExternalResourcesSection(props: ExternalResourcesSectionProps) {
  return (
    <SharedExternalResourcesSection
      {...props}
      slots={{ Section }}
    />
  )
}
