'use server'

import { getGuides, getWebsites } from '@/lib/content-loader'
import { getFeaturedProjects, getRecentlyUpdatedProjects } from '@/lib/project-utils'

/**
 * Fetches homepage data including featured projects, recently updated projects, and initial website list
 * Optimized to load only first 48 websites initially to improve performance
 *
 * @returns Promise containing homepage data with pagination info
 */
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
    featuredGuides
  }
}
