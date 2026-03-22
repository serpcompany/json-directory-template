export const routes = {
  home: '/',
  developerTools: '/developer-tools/',
  featured: '/featured/',
  guides: '/guides/',
  members: '/members/',
  projects: '/projects/',
  websites: '/websites/',
  github: 'https://github.com/thedaviddias/llms-txt-hub'
} as const

export function getCategoryRoute(slug: string): string {
  return `/${slug}/`
}

export function getWebsiteRoute(slug: string): string {
  return `/websites/${slug}/`
}