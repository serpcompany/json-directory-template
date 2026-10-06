import { resolveDrBadgeConfig } from './dr-badge'

export type FooterBadgeConfig = {
  alt: string
  href: string
  src: string
  title?: string
}

const featuredOnBestSerpCoBadgesByDomain: Record<string, FooterBadgeConfig> = {
  'serp.ai': {
    alt: 'Featured on best.serp.co',
    href: 'https://best.serp.co/products/serp.ai/',
    src: 'https://best.serp.co/badge/featured-on-serp.co-light.svg',
    title: 'Featured on best.serp.co'
  }
}

function resolveFeaturedOnBestSerpCoBadgeConfig(domain: string): FooterBadgeConfig | undefined {
  return featuredOnBestSerpCoBadgesByDomain[domain.toLowerCase()]
}

export function resolveFooterBadgeConfigs(domain: string): FooterBadgeConfig[] {
  return [resolveFeaturedOnBestSerpCoBadgeConfig(domain), resolveDrBadgeConfig(domain)].filter(
    (badge): badge is FooterBadgeConfig => Boolean(badge)
  )
}
