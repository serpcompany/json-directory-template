import { defaultSiteConfig } from '@thedaviddias/site-contract'
import { resolveCheckedInSiteCategories } from '@thedaviddias/site-contract/categories'
import type { SiteCategoryInput } from '@thedaviddias/site-contract/types'
import type { LucideIcon } from 'lucide-react'
import {
  Brain,
  Briefcase,
  Code2,
  Cpu,
  Database,
  Download,
  FileText,
  Globe,
  Lock,
  Package,
  ShoppingCart,
  User
} from 'lucide-react'

export interface Category {
  description: string
  icon: LucideIcon
  name: string
  priority: 'high' | 'medium' | 'low'
  slug: string
}

type CategoryPresentation = {
  description?: string
  icon?: LucideIcon
  priority?: Category['priority']
}

const categoryPresentationBySlug: Record<string, CategoryPresentation> = {
  'agency-services': {
    description: 'Agencies, consultancies, and service providers',
    icon: Briefcase,
    priority: 'low'
  },
  'ai-ml': {
    description: 'AI models, ML tools, LLM platforms, and AI services',
    icon: Brain,
    priority: 'high'
  },
  'business-operations': {
    description: 'Business management, operations, and enterprise tools',
    icon: Briefcase,
    priority: 'low'
  },
  'content-media': {
    description: 'Publishing platforms, content management, and media tools',
    icon: FileText,
    priority: 'low'
  },
  'data-analytics': {
    description: 'Databases, analytics platforms, BI tools, and data processing',
    icon: Database,
    priority: 'high'
  },
  'developer-tools': {
    description: 'APIs, frameworks, libraries, IDEs, and development utilities',
    icon: Code2,
    priority: 'high'
  },
  'ecommerce-retail': {
    description: 'Online stores, marketplaces, and retail platforms',
    icon: ShoppingCart,
    priority: 'low'
  },
  'finance-fintech': {
    description: 'Financial services, payment platforms, and fintech tools',
    icon: Briefcase,
    priority: 'medium'
  },
  international: {
    description: 'Non-English and international websites',
    icon: Globe,
    priority: 'low'
  },
  'infrastructure-cloud': {
    description: 'Cloud platforms, hosting, containers, and DevOps tools',
    icon: Cpu,
    priority: 'high'
  },
  'marketing-sales': {
    description: 'Marketing tools, CRM, sales platforms, and customer engagement',
    icon: User,
    priority: 'medium'
  },
  other: {
    description: "Everything else that doesn't fit other categories",
    icon: Package,
    priority: 'low'
  },
  personal: {
    description: 'Personal websites, portfolios, and blogs',
    icon: User,
    priority: 'low'
  },
  'security-identity': {
    description: 'Security tools, authentication, encryption, and compliance',
    icon: Lock,
    priority: 'high'
  },
  'video-downloaders': {
    description: 'Downloaders, recorders, and browser tools for saving online video',
    icon: Download,
    priority: 'medium'
  }
}

export const categoryAliases: Record<string, string> = {
  'automation-workflow': 'video-downloaders',
  'course-platforms': 'course-platform-downloaders',
  'image-downloader': 'image-downloaders',
  'image-hosting': 'image-downloaders',
  'integration-automation': 'video-downloaders',
  livestream: 'livestream-downloaders',
  'movies-and-tv': 'movies-and-tv-downloaders',
  'movies-tv': 'movies-and-tv-downloaders',
  'social-media': 'social-media-downloaders'
}

function resolveRuntimeSiteId(): string {
  return process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || defaultSiteConfig.id
}

function buildFallbackDescription(name: string): string {
  return `Browse ${name.toLowerCase()} listings and resources.`
}

function resolveCategoryDescription(category: SiteCategoryInput): string {
  return (
    category.description ||
    categoryPresentationBySlug[category.slug]?.description ||
    buildFallbackDescription(category.name)
  )
}

function resolveCategoryPriority(category: SiteCategoryInput): Category['priority'] {
  return category.priority || categoryPresentationBySlug[category.slug]?.priority || 'low'
}

function resolveCategoryIcon(slug: string): LucideIcon {
  return categoryPresentationBySlug[slug]?.icon || Package
}

export function normalizeCategorySlug(slug: string): string {
  return categoryAliases[slug] || slug
}

export function resolveCategories(siteId = resolveRuntimeSiteId()): Category[] {
  return resolveCheckedInSiteCategories(siteId).map(category => ({
    description: resolveCategoryDescription(category),
    icon: resolveCategoryIcon(category.slug),
    name: category.name,
    priority: resolveCategoryPriority(category),
    slug: category.slug
  }))
}

export const categories: Category[] = resolveCategories()

export const getCategoryBySlug = (slug: string): Category | undefined => {
  const normalizedSlug = normalizeCategorySlug(slug)
  return categories.find(category => category.slug === normalizedSlug)
}

export const getCategoryLabel = (slug: string): string => {
  return getCategoryBySlug(slug)?.name || normalizeCategorySlug(slug)
}

export const getCategoryIcon = (slug: string): LucideIcon => {
  const category = getCategoryBySlug(slug)
  return category?.icon || Package
}
