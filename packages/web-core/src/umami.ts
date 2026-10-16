import type { SiteConfig } from './site-config'

/** Hostnames the Umami script counts: the site's domain and its www twin. */
export function resolveUmamiDomains(siteConfig: Pick<SiteConfig, 'domain'>): string[] {
  return [siteConfig.domain, `www.${siteConfig.domain}`]
}
