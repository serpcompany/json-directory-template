export interface Category {
  slug: string
  name: string
  description: string
  intro: string
  seoTitle: string
}

export interface CategoryWithCount extends Category {
  count: number
}

export interface WebsiteSection {
  title: string
  content: string[]
}

export interface Website {
  slug: string
  name: string
  mark: string
  tagline: string
  description: string
  category: string
  secondaryCategory: string
  website: string
  pricing: string
  status: string
  featured: boolean
  addedDate: string
  installCount: string
  stack: string[]
  highlights: string[]
  sections: WebsiteSection[]
}

export interface Guide {
  slug: string
  title: string
  description: string
  category: string
  level: string
}

export interface Member {
  slug: string
  name: string
  handle: string
  headline: string
  joinedMonth: string
}

export interface Project {
  slug: string
  name: string
  description: string
  repository: string
  website: string
  stars: number
  updated: string
  featured: boolean
}

export interface Tool {
  slug: string
  name: string
  description: string
  href: string
  ctaLabel: string
  meta: string
}

export interface Step {
  step: number
  title: string
  description: string
}