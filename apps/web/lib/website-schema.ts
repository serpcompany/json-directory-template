import { z } from 'zod'
import { normalizeCategorySlug } from './categories'

const publishedAtPattern = /^\d{4}-\d{2}-\d{2}$/

export const websitePrioritySchema = z.enum(['high', 'medium', 'low'])

export const websiteJsonEntrySchema = z
  .object({
    category: z.string().trim().min(1, 'category is required'),
    content: z.string().min(1, 'content must not be empty').optional(),
    description: z.string().trim().min(1, 'description is required'),
    domain: z.string().url('domain must be a valid URL').optional(),
    favicon: z.string().url('favicon must be a valid URL').optional(),
    featured: z.boolean().optional(),
    isUnofficial: z.boolean().optional(),
    llmsFullUrl: z.string().url('llmsFullUrl must be a valid URL').optional(),
    llmsTxtUrl: z.string().url('llmsTxtUrl must be a valid URL').optional(),
    llmsUrl: z.string().url('llmsUrl must be a valid URL').optional(),
    name: z.string().trim().min(1, 'name is required'),
    priority: websitePrioritySchema.optional(),
    publishedAt: z
      .string()
      .regex(publishedAtPattern, 'publishedAt must use YYYY-MM-DD format'),
    slug: z.string().trim().min(1, 'slug must not be empty').optional(),
    website: z.string().url('website must be a valid URL').optional()
  })
  .superRefine((entry, context) => {
    if (!entry.website && !entry.domain) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'website or domain is required',
        path: ['website']
      })
    }

    if (!entry.llmsUrl && !entry.llmsTxtUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'llmsUrl or llmsTxtUrl is required',
        path: ['llmsUrl']
      })
    }
  })

export const websiteJsonEntriesSchema = z.array(websiteJsonEntrySchema)

export type WebsiteJsonEntry = z.infer<typeof websiteJsonEntrySchema>
export type WebsitePriority = z.infer<typeof websitePrioritySchema>

export interface NormalizedWebsiteEntry {
  category: string
  content?: string
  description: string
  featured?: boolean
  isUnofficial?: boolean
  llmsFullUrl?: string | null
  llmsUrl: string
  name: string
  priority?: WebsitePriority
  publishedAt: string
  slug: string
  website: string
}

function slugifyWebsiteName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
}

function normalizeJsonCategory(category: string): string {
  return normalizeCategorySlug(category)
}

function sanitizeWebsiteDescription(description: string): string {
  return description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parseJsonWebsiteEntries(input: unknown): WebsiteJsonEntry[] {
  const result = websiteJsonEntriesSchema.safeParse(input)

  if (result.success) {
    return result.data
  }

  const details = result.error.issues
    .map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `${path}: ${issue.message}`
    })
    .join('; ')

  throw new Error(`Invalid data/websites.json shape: ${details}`)
}

export function normalizeJsonWebsite(entry: WebsiteJsonEntry): NormalizedWebsiteEntry {
  return {
    category: normalizeJsonCategory(entry.category),
    content: entry.content,
    description: sanitizeWebsiteDescription(entry.description),
    featured: entry.featured,
    isUnofficial: entry.isUnofficial,
    llmsFullUrl: entry.llmsFullUrl || null,
    llmsUrl: entry.llmsUrl || entry.llmsTxtUrl || '',
    name: entry.name,
    priority: entry.priority,
    publishedAt: entry.publishedAt,
    slug: entry.slug || slugifyWebsiteName(entry.name),
    website: entry.website || entry.domain || ''
  }
}
