import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

const publishedAtPattern = /^\d{4}-\d{2}-\d{2}$/

const websitePrioritySchema = z.enum(['high', 'medium', 'low'])

const websiteJsonEntrySchema = z
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
    publishedAt: z.string().regex(publishedAtPattern, 'publishedAt must use YYYY-MM-DD format'),
    slug: z.string().trim().min(1, 'slug must not be empty').optional(),
    website: z.string().url('website must be a valid URL').optional()
  })
  .superRefine((entry, ctx) => {
    if (!entry.website && !entry.domain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'website or domain is required',
        path: ['website']
      })
    }
    if (!entry.llmsUrl && !entry.llmsTxtUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'llmsUrl or llmsTxtUrl is required',
        path: ['llmsUrl']
      })
    }
  })

const websiteJsonEntriesSchema = z.array(websiteJsonEntrySchema)

const dataPath = resolve(process.cwd(), process.argv[2] || 'data/websites.json')

console.log(`Validating: ${dataPath}`)

let raw: string
try {
  raw = readFileSync(dataPath, 'utf-8')
} catch (err) {
  console.error(`Failed to read ${dataPath}`)
  process.exit(1)
}

let parsed: unknown
try {
  parsed = JSON.parse(raw)
} catch {
  console.error('Invalid JSON')
  process.exit(1)
}

const result = websiteJsonEntriesSchema.safeParse(parsed)

if (!result.success) {
  console.error('\nValidation failed:\n')
  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
    console.error(`  [${path}] ${issue.message}`)
  }
  console.error(`\n${result.error.issues.length} error(s) found`)
  process.exit(1)
}

console.log(`Valid — ${result.data.length} entries`)
