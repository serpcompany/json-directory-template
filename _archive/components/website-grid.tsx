import type { Website } from '@/lib/types'
import { WebsiteCard } from '@/components/website-card'

interface WebsiteGridProps {
  websites: Website[]
}

export function WebsiteGrid({ websites }: WebsiteGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {websites.map(website => (
        <WebsiteCard key={website.slug} website={website} />
      ))}
    </div>
  )
}