import {
  ExternalResourcesSection as SharedExternalResourcesSection,
  type ExternalResourcesSectionProps,
} from '@thedaviddias/web-core/sections/external-resources-section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ExternalResourcesSection(props: Omit<ExternalResourcesSectionProps, 'slots'>) {
  return (
    <SharedExternalResourcesSection
      {...props}
      slots={{ Card, CardContent, CardDescription, CardHeader, CardTitle }}
    />
  )
}
