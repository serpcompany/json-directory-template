import type { SiteConfig } from './site-config';

export function resolveGoogleTagManagerId(
  siteConfig: Pick<SiteConfig, 'gtmId'>,
  nodeEnv = process.env.NODE_ENV
): string | undefined {
  if (nodeEnv !== 'production') {
    return undefined;
  }

  return siteConfig.gtmId;
}
