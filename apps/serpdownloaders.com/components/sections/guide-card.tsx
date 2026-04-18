import { Badge } from '@thedaviddias/design-system/badge'
import { Card, CardContent } from '@/components/ui/card'
import { GuideCard as SharedGuideCard } from '@thedaviddias/web-core/sections/guide-card'
import type { GuideMetadata } from '@/lib/content-loader'

interface GuideCardProps {
  guide: GuideMetadata
  index?: number
}

export function GuideCard({ guide, index = 0 }: GuideCardProps) {
  return (
    <SharedGuideCard
      guide={guide}
      index={index}
      slots={{ Badge, Card, CardContent }}
    />
  )
}
