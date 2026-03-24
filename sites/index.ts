import { defaultSiteConfig } from './site-config.default'
import { defaultSiteContent, resolveSiteContent } from './site-content'
import { serpdownloadersSiteConfig } from './serpdownloaders/site-config'
import type { CheckedInSiteConfig, CheckedInSiteConfigOverride, DeepPartial } from './types'

export const siteConfigsById: Record<string, CheckedInSiteConfigOverride> = {
  serpdownloaders: serpdownloadersSiteConfig
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined) {
    return base
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return (override as T) ?? base
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base
  }

  const baseRecord = base as Record<string, unknown>
  const overrideRecord = override as Record<string, unknown>
  const mergedEntries = Object.keys({ ...baseRecord, ...overrideRecord }).map(key => {
    const baseValue = baseRecord[key]
    const overrideValue = overrideRecord[key]

    if (overrideValue === undefined) {
      return [key, baseValue]
    }

    return [
      key,
      deepMerge(baseValue, overrideValue as DeepPartial<typeof baseValue>)
    ]
  })

  return Object.fromEntries(mergedEntries) as T
}

function mergeCheckedInSiteConfig(
  base: CheckedInSiteConfig,
  override: CheckedInSiteConfigOverride
): CheckedInSiteConfig {
  return deepMerge(base, override as DeepPartial<CheckedInSiteConfig>) as CheckedInSiteConfig
}

export function resolveCheckedInSiteConfig(siteId?: string): CheckedInSiteConfig {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteConfig
  }

  const siteOverride = siteConfigsById[siteId]

  if (!siteOverride) {
    return defaultSiteConfig
  }

  return mergeCheckedInSiteConfig(defaultSiteConfig, siteOverride)
}

export { defaultSiteConfig }
export { defaultSiteContent, resolveSiteContent }
export type { CheckedInSiteConfig, CheckedInSiteConfigOverride } from './types'
