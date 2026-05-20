import { createTaxonomiesSitemapResponse } from '@thedaviddias/web-core/sitemaps'
import { getWebsites } from '@/lib/content-loader'

export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  return createTaxonomiesSitemapResponse({ getWebsites })
}
