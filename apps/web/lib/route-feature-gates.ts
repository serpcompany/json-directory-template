import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateBaseMetadata } from '@thedaviddias/web-core/seo-config'
import { siteConfig, type SiteConfig } from '@thedaviddias/web-core/site-config'

type RoutableSiteFeature = keyof Pick<
  SiteConfig['features'],
  'showAuth' | 'showDocs' | 'showFavorites' | 'showGuides' | 'showProjects'
>

export function isRouteFeatureEnabled(feature: RoutableSiteFeature): boolean {
  return Boolean(siteConfig.features[feature])
}

export function requireRouteFeature(feature: RoutableSiteFeature): void {
  if (!isRouteFeatureEnabled(feature)) {
    notFound()
  }
}

export function generateDisabledRouteMetadata(): Metadata {
  return generateBaseMetadata({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    noindex: true
  })
}
