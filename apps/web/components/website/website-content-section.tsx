import { components } from '@/components/mdx';
import type { WebsiteMetadata } from '@/lib/content-loader';
import { WebsiteContentSection as SharedWebsiteContentSection } from '@thedaviddias/web-core/website/website-content-section';

interface WebsiteContentSectionProps {
  website: WebsiteMetadata;
}

export function WebsiteContentSection({
  website,
}: WebsiteContentSectionProps) {
  return (
    <SharedWebsiteContentSection
      website={website}
      mdxComponents={components}
    />
  );
}
