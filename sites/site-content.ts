import { defaultSiteConfig } from './site-config.default';
import { defaultSiteContent } from './site-content.default';
import { extensionsSerpCoSiteContent } from './extensions.serp.co/site-content';
import { serpdownloadersComSiteContent } from './serpdownloaders.com/site-content';
import type { SiteOwnedContent } from './types';

const siteContentById: Record<string, SiteOwnedContent> = {
  'extensions.serp.co': extensionsSerpCoSiteContent,
  'serpdownloaders.com': serpdownloadersComSiteContent,
};

export function resolveSiteContent(siteId?: string): SiteOwnedContent {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteContent;
  }

  return siteContentById[siteId] ?? defaultSiteContent;
}

export { defaultSiteContent };
