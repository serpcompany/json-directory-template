interface BadgePreviewProps {
  siteId: string
  theme: 'light' | 'dark'
}

export function BadgePreview({ siteId, theme }: BadgePreviewProps) {
  return (
    <img
      src={`/badge/featured-on-${siteId}-${theme}.svg`}
      alt={`Featured on ${siteId}`}
      width={153}
      height={44}
    />
  )
}
