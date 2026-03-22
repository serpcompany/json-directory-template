import type { Metadata } from 'next'
import { WebsiteGrid } from '@/components/website-grid'
import { getWebsites } from '@/lib/data'

export const metadata: Metadata = {
  title: 'All Websites',
  description: 'Browse the complete directory of websites implementing the llms.txt standard.'
}

export default function WebsitesPage() {
  const websites = getWebsites()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
            <span className="size-2 rounded-full bg-foreground" />
            All Websites
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse the complete directory of websites implementing the llms.txt standard.
          </p>
        </header>

        <WebsiteGrid websites={websites} />
      </div>
    </div>
  )
}