import { getGuides, getWebsites } from '@/lib/content-loader'
import { buildHomePageData } from '@thedaviddias/web-core/home-page'

export async function getHomePageData() {
  return buildHomePageData({
    guides: getGuides(),
    websites: getWebsites(),
  })
}
