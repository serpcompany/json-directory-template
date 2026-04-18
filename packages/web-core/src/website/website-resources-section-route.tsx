import type { WebsiteMetadata } from '../content-query'
import { Section } from '../layout/section'
import { WebsiteResourcesSection as SharedWebsiteResourcesSection } from './website-resources-section'
import { WebsiteCliSectionRoute } from './website-cli-section-route'

interface WebsiteResourcesSectionRouteProps {
  website: WebsiteMetadata
}

export function WebsiteResourcesSectionRoute({
  website,
}: WebsiteResourcesSectionRouteProps) {
  return (
    <SharedWebsiteResourcesSection
      website={website}
      slots={{ Section, WebsiteCliSection: WebsiteCliSectionRoute }}
    />
  )
}
