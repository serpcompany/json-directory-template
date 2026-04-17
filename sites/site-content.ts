import { defaultSiteConfig } from './site-config.default';
import { defaultSiteContent } from './site-content.default';
import { serpdownloadersComSiteContent } from './serpdownloaders.com/site-content';
import { assertSiteIdIsNotRemoved } from './active-site-ids';
import type { SiteOwnedContent } from './types';

const siteContentById: Record<string, SiteOwnedContent> = {
  'serpdownloaders.com': serpdownloadersComSiteContent,
};

export function resolveSiteContent(siteId?: string): SiteOwnedContent {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteContent;
  }

  assertSiteIdIsNotRemoved(siteId);

  return siteContentById[siteId] ?? defaultSiteContent;
}

export { defaultSiteContent };
