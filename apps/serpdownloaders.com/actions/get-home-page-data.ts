import { getGuides, getWebsites } from '@/lib/content-loader'
import { getFeaturedProjects, getRecentlyUpdatedProjects } from '@/lib/project-utils'

export async function getHomePageData() {
  const allProjects = getWebsites()
  const featuredProjects = getFeaturedProjects(allProjects)
  const recentlyUpdatedProjects = getRecentlyUpdatedProjects(allProjects, 8)
  const featuredGuides = getGuides()

  return {
    allProjects,
    featuredProjects,
    recentlyUpdatedProjects,
    totalCount: allProjects.length,
    featuredGuides,
  }
}
