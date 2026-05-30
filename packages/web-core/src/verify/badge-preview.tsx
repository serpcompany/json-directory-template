import { getFeaturedOnBadgePreviewPath } from '../website/featured-on-badge-url'

interface BadgePreviewProps {
  siteId: string
  theme: 'light' | 'dark'
}

export function BadgePreview({ siteId, theme }: BadgePreviewProps) {
  return (
    <img
      src={getFeaturedOnBadgePreviewPath(siteId, theme)}
      alt={`Featured on ${siteId}`}
      width={153}
      height={44}
      className="h-auto max-w-full"
    />
  )
}
