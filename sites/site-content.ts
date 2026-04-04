import { defaultSiteConfig } from './site-config.default';
import { defaultSiteContent } from './site-content.default';
import { serpSoftwareSiteContent } from './serp.software/site-content';
import { serpdownloadersComSiteContent } from './serpdownloaders.com/site-content';
import type { SiteOwnedContent } from './types';

const siteContentById: Record<string, SiteOwnedContent> = {
  'serp.software': serpSoftwareSiteContent,
  'serpdownloaders.com': serpdownloadersComSiteContent,
};

export function resolveSiteContent(siteId?: string): SiteOwnedContent {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteContent;
  }

  return siteContentById[siteId] ?? defaultSiteContent;
}

export { defaultSiteContent };
