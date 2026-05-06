import type { Metadata } from 'next'
import {
  generateProjectsPageMetadata,
  ProjectsPageRoute,
} from '@thedaviddias/web-core/projects-page'
import {
  generateDisabledRouteMetadata,
  isRouteFeatureEnabled,
  requireRouteFeature
} from '@/lib/route-feature-gates'

export function generateMetadata(): Metadata {
  if (!isRouteFeatureEnabled('showProjects')) {
    return generateDisabledRouteMetadata()
  }

  return generateProjectsPageMetadata()
}

export default function ProjectsPage() {
  requireRouteFeature('showProjects')

  return <ProjectsPageRoute />
}
