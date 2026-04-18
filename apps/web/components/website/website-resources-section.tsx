import { Section } from '@/components/layout/section';
import { WebsiteCliSection } from '@/components/website/website-cli-section';
import type { WebsiteMetadata } from '@/lib/content-loader';
import { WebsiteResourcesSection as SharedWebsiteResourcesSection } from '@thedaviddias/web-core/website/website-resources-section';

interface WebsiteResourcesSectionProps {
  website: WebsiteMetadata;
}

export function WebsiteResourcesSection({
  website,
}: WebsiteResourcesSectionProps) {
  return (
    <SharedWebsiteResourcesSection
      website={website}
      slots={{ Section, WebsiteCliSection }}
    />
  );
}
