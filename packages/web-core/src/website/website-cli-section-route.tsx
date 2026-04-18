import type { WebsiteMetadata } from '../content-query'
import { CopyButton } from '../ui/copy-button'
import { WebsiteCliSection as SharedWebsiteCliSection } from './website-cli-section'

interface WebsiteCliSectionRouteProps {
  website: WebsiteMetadata
}

export function WebsiteCliSectionRoute({ website }: WebsiteCliSectionRouteProps) {
  return <SharedWebsiteCliSection website={website} slots={{ CopyButton }} />
}
