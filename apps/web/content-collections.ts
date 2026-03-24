import { defineCollection, defineConfig } from '@content-collections/core'

// Paths will resolve from the project root
const websitesPath = '../../packages/content/data/websites'
const guidesPath = '../../packages/content/data/guides'
const resourcesPath = '../../packages/content/data/resources'
const legalPath = '../../packages/content/data/legal'
const docsPath = '../../packages/content/data/docs'
const aboutPath = '../../packages/content/data/about'
const extensionUpdatesPath = '../../packages/content/data/extension-updates'

const websites = defineCollection({
  name: 'Website',
  directory: websitesPath,
  include: '**/*.mdx',
  schema: z => ({
    slug: z.string().optional(),
    name: z.string(),
    description: z.string(),
    website: z.string().url(),
    category: z.string(),
    publishedAt: z.string(),
    isUnofficial: z.boolean().optional().default(false),
    priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
    featured: z.boolean().optional().default(false),
    resourceLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url()
        })
      )
      .optional()
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

const guides = defineCollection({
  name: 'Guide',
  directory: guidesPath,
  include: '**/*.mdx',
  schema: z => ({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    image: z.string().optional(),
    authors: z.array(
      z.object({
        name: z.string(),
        url: z.string().url().optional()
      })
    ),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    category: z
      .enum(['getting-started', 'implementation', 'best-practices', 'integration'])
      .default('getting-started'),
    published: z.boolean().default(true),
    publishedAt: z.string().optional(),
    readingTime: z.number().optional()
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

const resources = defineCollection({
  name: 'Resource',
  directory: resourcesPath,
  include: '**/*.mdx',
  schema: z => ({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    category: z.string(),
    icon: z.string().optional(),
    featured: z.boolean().optional().default(false)
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

const legal = defineCollection({
  name: 'Legal',
  directory: legalPath,
  include: '**/*.mdx',
  schema: z => ({
    title: z.string().optional(),
    lastUpdated: z.string().optional(),
    summary: z.string().optional()
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

const docs = defineCollection({
  name: 'Doc',
  directory: docsPath,
  include: '**/*.mdx',
  schema: z => ({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    published: z.boolean().default(true)
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

const aboutPages = defineCollection({
  name: 'AboutPage',
  directory: aboutPath,
  include: '**/*.mdx',
  schema: z => ({
    title: z.string(),
    description: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    keywords: z.array(z.string()).default([]),
    introTitle: z.string(),
    introBody: z.string(),
    whatIsTitle: z.string(),
    whatIsBody: z.string(),
    missionTitle: z.string(),
    missionIntro: z.string(),
    missionItems: z.array(z.string()).default([]),
    stepsTitle: z.string(),
    steps: z
      .array(
        z.object({
          icon: z.enum(['file-text', 'code', 'zap']),
          title: z.string(),
          body: z.string()
        })
      )
      .default([]),
    communityTitle: z.string(),
    communityBody: z.string(),
    primaryCtaLabel: z.string(),
    secondaryCtaLabel: z.string(),
    contactTitle: z.string(),
    contactBody: z.string(),
    contactEmail: z.string().email(),
    published: z.boolean().default(true)
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

const extensionUpdates = defineCollection({
  name: 'ExtensionUpdate',
  directory: extensionUpdatesPath,
  include: '**/*.mdx',
  schema: z => ({
    version: z.string(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    published: z.boolean().default(true),
    highlights: z.array(z.string()).max(5).default([])
  }),
  transform: document => ({
    ...document,
    slug: document._meta.path || document._meta.fileName.replace(/\.mdx$/, '')
  })
})

export default defineConfig({
  collections: [websites, guides, resources, legal, docs, aboutPages, extensionUpdates]
})
