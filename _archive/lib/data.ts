import categories from '@/data/categories.json'
import guides from '@/data/guides.json'
import members from '@/data/members.json'
import products from '@/data/products.json'
import projects from '@/data/projects.json'
import steps from '@/data/steps.json'
import tools from '@/data/tools.json'
import type {
  Category,
  CategoryWithCount,
  Guide,
  Member,
  Project,
  Step,
  Tool,
  Website
} from '@/lib/types'

const categoryList = categories as Category[]
const guideList = guides as Guide[]
const memberList = members as Member[]
const projectList = projects as Project[]
const stepList = steps as Step[]
const toolList = tools as Tool[]
const websiteList = products as Website[]

export function getCategories() {
  return [...categoryList]
}

export function getCategoryBySlug(slug: string) {
  return categoryList.find(category => category.slug === slug)
}

export function getCategoryCounts(): CategoryWithCount[] {
  return categoryList.map(category => ({
    ...category,
    count: websiteList.filter(website => website.category === category.slug).length
  }))
}

export function getWebsites() {
  return [...websiteList].sort((left, right) => left.name.localeCompare(right.name))
}

export function getFeaturedWebsites() {
  return getWebsites().filter(website => website.featured)
}

export function getRecentWebsites() {
  return [...websiteList]
    .sort((left, right) => Date.parse(right.addedDate) - Date.parse(left.addedDate))
    .slice(0, 6)
}

export function getWebsitesByCategory(slug: string) {
  return getWebsites().filter(website => website.category === slug)
}

export function getWebsitesBySlugs(slugs: string[]) {
  const slugSet = new Set(slugs)

  return getWebsites().filter(website => slugSet.has(website.slug))
}

export function getWebsiteBySlug(slug: string) {
  return websiteList.find(website => website.slug === slug)
}

export function getWebsiteSlugs() {
  return websiteList.map(website => website.slug)
}

export function getWebsiteNeighbors(slug: string) {
  const websites = getWebsites()
  const currentIndex = websites.findIndex(website => website.slug === slug)

  if (currentIndex === -1) {
    return {
      nextWebsite: null,
      previousWebsite: null
    }
  }

  return {
    nextWebsite: websites[currentIndex + 1] ?? null,
    previousWebsite: websites[currentIndex - 1] ?? null
  }
}

export function getRelatedWebsites(website: Website) {
  return websiteList
    .filter(entry => entry.slug !== website.slug && entry.category === website.category)
    .slice(0, 3)
}

export function getGuides() {
  return [...guideList]
}

export function getMembers() {
  return [...memberList]
}

export function getProjects() {
  return [...projectList].sort((left, right) => right.stars - left.stars)
}

export function getFeaturedProject() {
  return getProjects().find(project => project.featured) ?? getProjects()[0]
}

export function getTools() {
  return [...toolList]
}

export function getSteps() {
  return [...stepList]
}

export function getSiteStats() {
  return {
    websiteCount: websiteList.length,
    categoryCount: categoryList.length,
    featuredCount: websiteList.filter(website => website.featured).length,
    toolCount: toolList.length
  }
}

export function getWebsiteDomain(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function getWebsiteFavicon(url: string) {
  const domain = getWebsiteDomain(url)

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
}

export function getDocumentationLinks(url: string) {
  const trimmedUrl = url.endsWith('/') ? url.slice(0, -1) : url

  return {
    llms: `${trimmedUrl}/llms.txt`,
    llmsFull: `${trimmedUrl}/llms-full.txt`
  }
}