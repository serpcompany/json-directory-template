import { defaultSiteConfig } from './site-config.default'
import { defaultSiteContent } from './site-content.default'
import { serpdownloadersSiteContent } from './serpdownloaders/site-content'
import type { SiteOwnedContent } from './types'

const siteContentById: Record<string, SiteOwnedContent> = {
  serpdownloaders: serpdownloadersSiteContent
}

export function resolveSiteContent(siteId?: string): SiteOwnedContent {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteContent
  }

  return siteContentById[siteId] ?? defaultSiteContent
}

export { defaultSiteContent }
