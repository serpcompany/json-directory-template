import type { WebsiteMetadata } from '@/lib/content-loader';
import { WebsiteDetailSidebar as SharedWebsiteDetailSidebar } from '@thedaviddias/web-core/website/website-detail-sidebar';

interface WebsiteDetailSidebarProps {
  website: WebsiteMetadata;
}

export function WebsiteDetailSidebar({ website }: WebsiteDetailSidebarProps) {
  return <SharedWebsiteDetailSidebar website={website} />;
}
