import type { MetadataRoute } from 'next'
import { createCanonicalRobots } from '@thedaviddias/web-core/sitemaps'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return createCanonicalRobots()
}
