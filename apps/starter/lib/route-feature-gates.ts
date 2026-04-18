import { notFound } from 'next/navigation'
import {
  isRouteFeatureEnabled,
  type RoutableSiteFeature,
  generateDisabledRouteMetadata,
} from '@thedaviddias/web-core/route-feature-gates'

export function requireRouteFeature(feature: RoutableSiteFeature): void {
  if (!isRouteFeatureEnabled(feature)) {
    notFound()
  }
}

export { generateDisabledRouteMetadata, isRouteFeatureEnabled }
