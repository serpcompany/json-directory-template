import {
  defaultSiteConfig,
  resolveSiteContent as resolveCheckedInSiteContent
} from '../../../sites/index'
import type { SiteOwnedContent } from '../../../sites/types'

export function resolveSiteContent(
  siteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || defaultSiteConfig.id
): SiteOwnedContent {
  return resolveCheckedInSiteContent(siteId)
}

export const siteContent: SiteOwnedContent = resolveSiteContent()
