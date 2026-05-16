import type { Metadata } from 'next'
import { getWebsites } from '@/lib/content-loader'
import { StaticWebsitesListRoute as StaticWebsitesList } from '@thedaviddias/web-core/sections/static-websites-list-route'
import { SITE_NAME, SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'

export function generateMetadata(): Metadata {
  return {
    title: `Products - ${SITE_NAME}`,
    description: 'Browse browser extension products and downloaders.',
    alternates: {
      canonical: `${SITE_PUBLIC_URL}/products`,
    },
  }
}

export default function ProductsPage() {
  const websites = getWebsites()

  return (
    <main className="border-t px-6 py-8">
      <StaticWebsitesList
        websites={websites}
        totalCount={websites.length}
        displayLimit={200}
      />
    </main>
  )
}
