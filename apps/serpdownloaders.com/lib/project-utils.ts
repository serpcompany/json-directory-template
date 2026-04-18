import type { WebsiteMetadata } from './content-loader'

export function getFeaturedProjects(projects: WebsiteMetadata[]): WebsiteMetadata[] {
  const featuredProjects = projects.filter(project => project.featured === true)

  if (featuredProjects.length > 0) {
    return featuredProjects.slice(0, 8)
  }

  return [...projects]
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, 8)
}

export function getRecentlyUpdatedProjects(
  projects: WebsiteMetadata[],
  limit = 5
): WebsiteMetadata[] {
  return [...projects]
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, limit)
}
