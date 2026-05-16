import { browserextensionsIoSiteConfig } from '../../../sites/browserextensions.io/site-config';
import { pornvideodownloadersComSiteConfig } from '../../../sites/pornvideodownloaders.com/site-config';
import { serpAiSiteConfig } from '../../../sites/serp.ai/site-config';
import { serpCoSiteConfig } from '../../../sites/serp.co/site-config';
import { serpSoftwareSiteConfig } from '../../../sites/serp.software/site-config';
import { serpdownloadersComSiteConfig } from '../../../sites/serpdownloaders.com/site-config';
import { assertSiteIdIsSupported } from './active-site-ids';
import { defaultSiteConfig } from './default-site-config';
import { defaultSiteContent, resolveSiteContent } from './site-content';
import type {
  CheckedInSiteConfig,
  CheckedInSiteConfigOverride,
  DeepPartial,
} from './types';

export { defaultSiteConfig, defaultSiteContent, resolveSiteContent };
export type { CheckedInSiteConfig, CheckedInSiteConfigOverride } from './types';

export const siteConfigsById: Record<string, CheckedInSiteConfigOverride> = {
  'browserextensions.io': browserextensionsIoSiteConfig,
  'pornvideodownloaders.com': pornvideodownloadersComSiteConfig,
  'serp.ai': serpAiSiteConfig,
  'serp.co': serpCoSiteConfig,
  'serp.software': serpSoftwareSiteConfig,
  'serpdownloaders.com': serpdownloadersComSiteConfig,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return override as T;
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override as T;
  }

  const baseRecord = base as Record<string, unknown>;
  const overrideRecord = override as Record<string, unknown>;
  const mergedEntries = Object.keys({ ...baseRecord, ...overrideRecord }).map(
    (key) => {
      const baseValue = baseRecord[key];
      const overrideValue = overrideRecord[key];

      if (overrideValue === undefined) {
        return [key, baseValue];
      }

      return [
        key,
        deepMerge(baseValue, overrideValue as DeepPartial<typeof baseValue>),
      ];
    }
  );

  return Object.fromEntries(mergedEntries) as T;
}

function mergeCheckedInSiteConfig(
  base: CheckedInSiteConfig,
  override: CheckedInSiteConfigOverride
): CheckedInSiteConfig {
  return deepMerge(
    base,
    override as DeepPartial<CheckedInSiteConfig>
  ) as CheckedInSiteConfig;
}

export function resolveCheckedInSiteConfig(
  siteId?: string
): CheckedInSiteConfig {
  if (!siteId || siteId === defaultSiteConfig.id) {
    return defaultSiteConfig;
  }

  assertSiteIdIsSupported(siteId);
  const siteOverride = siteConfigsById[siteId];

  return mergeCheckedInSiteConfig(defaultSiteConfig, siteOverride);
}
