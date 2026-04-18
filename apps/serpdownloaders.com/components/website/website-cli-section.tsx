import { CopyButton } from '@/components/ui/copy-button'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { WebsiteCliSection as SharedWebsiteCliSection } from '@thedaviddias/web-core/website/website-cli-section'

interface WebsiteCliSectionProps {
  website: WebsiteMetadata
}

export function WebsiteCliSection({ website }: WebsiteCliSectionProps) {
  return (
    <SharedWebsiteCliSection website={website} slots={{ CopyButton }} />
  )
}
