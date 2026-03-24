import { defaultSiteConfig } from './site-config.default'
import { serpdownloadersSiteConfig } from './serpdownloaders/site-config'
import type { CheckedInSiteConfig } from './types'

export const siteConfigsById: Record<string, CheckedInSiteConfig> = {
  serpdownloaders: serpdownloadersSiteConfig
}

export function resolveCheckedInSiteConfig(siteId?: string): CheckedInSiteConfig {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteConfig
  }

  return siteConfigsById[siteId] || defaultSiteConfig
}

export { defaultSiteConfig }
export type { CheckedInSiteConfig } from './types'
