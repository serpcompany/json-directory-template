import type { MetadataRoute } from 'next'
import { SITE_PUBLIC_URL } from '@/lib/seo/seo-config'

export const dynamic = 'force-static'

function getSitemapPath(): string {
  return process.env.STATIC_EXPORT === 'true' ? 'sitemap-index.xml' : 'sitemap.xml'
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/404', '/500', '/submit', '/search']
    },
    sitemap: `${SITE_PUBLIC_URL}/${getSitemapPath()}`
  }
}
