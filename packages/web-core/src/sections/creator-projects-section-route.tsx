'use client'

import { Badge } from '@thedaviddias/design-system/badge'
import { Button } from '@thedaviddias/design-system/button'
import { analytics } from '../analytics'
import { Section } from '../layout/section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { CreatorProjectsSection as SharedCreatorProjectsSection } from './creator-projects-section'

export function CreatorProjectsSectionRoute() {
  return (
    <SharedCreatorProjectsSection
      onProjectClick={(name, url, destination, source) => {
        analytics.creatorProjectClick(name, url, destination, source)
      }}
      slots={{
        Badge,
        Button,
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
        Section,
      }}
    />
  )
}
