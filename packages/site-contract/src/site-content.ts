import { browserextensionsIoSiteContent } from '../../../sites/browserextensions.io/site-content';
import { serpAiSiteContent } from '../../../sites/serp.ai/site-content';
import { serpCoSiteContent } from '../../../sites/serp.co/site-content';
import { serpdownloadersComSiteContent } from '../../../sites/serpdownloaders.com/site-content';
import { assertSiteIdIsNotRemoved } from './active-site-ids';
import { defaultSiteConfig } from './default-site-config';
import { defaultSiteContent } from './default-site-content';
import type { SiteOwnedContent } from './types';

const siteContentById: Record<string, SiteOwnedContent> = {
  'browserextensions.io': browserextensionsIoSiteContent,
  'serp.ai': serpAiSiteContent,
  'serp.co': serpCoSiteContent,
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
