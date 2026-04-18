'use client'

import { Badge } from '@thedaviddias/design-system/badge'
import { Button } from '@thedaviddias/design-system/button'
import { Section } from '@thedaviddias/web-core/layout/section'
import { CreatorProjectsSection as SharedCreatorProjectsSection } from '@thedaviddias/web-core/sections/creator-projects-section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analytics } from '@/lib/analytics'

export function CreatorProjectsSection() {
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
