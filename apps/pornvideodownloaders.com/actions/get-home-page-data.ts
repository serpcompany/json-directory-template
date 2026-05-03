import { getGuides, getWebsites } from '@/lib/content-loader'
import { buildHomePageData } from '@thedaviddias/web-core/home-page'

/**
 * Fetches homepage data including featured projects, recently updated projects, and initial website list
 * Optimized to load only first 48 websites initially to improve performance
 *
 * @returns Promise containing homepage data with pagination info
 */
export async function getHomePageData() {
  return buildHomePageData({
    guides: getGuides(),
    websites: getWebsites(),
  })
}
