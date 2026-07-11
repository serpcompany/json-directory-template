import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { WebsiteJsonEntry } from '@thedaviddias/web-core/website-schema'

export type D1ListingStatus = 'approved' | 'draft' | 'rejected' | 'review'

export type D1ListingRecord = {
  categoriesJson: string
  category: string
  content: string | null
  createdAt: string
  description: string
  entityType: string | null
  featured: 0 | 1
  isUnofficial: 0 | 1
  mediaJson: string | null
  name: string
  priority: string | null
  publishedAt: string
  resourceLinksJson: string | null
  siteId: string
  slug: string
  sourceUpdatedAt: string | null
  status: D1ListingStatus
  updatedAt: string
  website: string
}

export type D1ListingExportFile = {
  exportedAt?: string
  rows: D1ListingRecord[]
  source: 'd1-public-listings'
  version: 1
}

function parseJsonColumn<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  return JSON.parse(value) as T
}

function toBooleanFlag(value: boolean | undefined): 0 | 1 {
  return value ? 1 : 0
}

export function d1RecordToWebsiteJsonEntry(record: D1ListingRecord): WebsiteJsonEntry {
  const categories = parseJsonColumn<string[]>(record.categoriesJson, [record.category])
  const media = parseJsonColumn<WebsiteJsonEntry['media'] | null>(record.mediaJson, null)
  const resourceLinks = parseJsonColumn<WebsiteJsonEntry['resourceLinks'] | null>(
    record.resourceLinksJson,
    null
  )

  return {
    categories,
    category: record.category,
    content: record.content ?? undefined,
    description: record.description,
    entityType: record.entityType ?? undefined,
    featured: Boolean(record.featured) || undefined,
    isUnofficial: Boolean(record.isUnofficial) || undefined,
    media: media ?? undefined,
    name: record.name,
    priority: (record.priority as WebsiteJsonEntry['priority']) ?? undefined,
    publishedAt: record.publishedAt,
    resourceLinks: resourceLinks ?? undefined,
    slug: record.slug,
    website: record.website
  }
}

export function readD1ListingExportEntries(options: {
  approvedOnly?: boolean
  exportPath: string
  siteId: string
}): WebsiteJsonEntry[] {
  const exportFile = JSON.parse(
    readFileSync(resolve(options.exportPath), 'utf8')
  ) as D1ListingExportFile

  if (exportFile.version !== 1 || exportFile.source !== 'd1-public-listings') {
    throw new Error(
      `Invalid D1 listings export at ${options.exportPath}: expected d1-public-listings version 1.`
    )
  }

  return exportFile.rows
    .filter(record => record.siteId === options.siteId)
    .filter(record => ((options.approvedOnly ?? true) ? record.status === 'approved' : true))
    .map(d1RecordToWebsiteJsonEntry)
}

export function websiteJsonEntryToD1Record(
  entry: WebsiteJsonEntry,
  options: {
    now: string
    siteId: string
    status?: D1ListingStatus
  }
): D1ListingRecord {
  const categories = entry.categories?.length
    ? entry.categories
    : entry.category
      ? [entry.category]
      : []
  const category = entry.category ?? categories[0]

  if (!category) {
    throw new Error(`Cannot convert listing "${entry.name}" to D1: category is required.`)
  }

  if (!entry.slug) {
    throw new Error(`Cannot convert listing "${entry.name}" to D1: slug is required.`)
  }

  const website = entry.website ?? entry.domain

  if (!website) {
    throw new Error(`Cannot convert listing "${entry.name}" to D1: website is required.`)
  }

  return {
    categoriesJson: JSON.stringify(categories),
    category,
    content: entry.content ?? null,
    createdAt: options.now,
    description: entry.description,
    entityType: entry.entityType ?? null,
    featured: toBooleanFlag(entry.featured),
    isUnofficial: toBooleanFlag(entry.isUnofficial),
    mediaJson: entry.media ? JSON.stringify(entry.media) : null,
    name: entry.name,
    priority: entry.priority ?? null,
    publishedAt: entry.publishedAt,
    resourceLinksJson: entry.resourceLinks ? JSON.stringify(entry.resourceLinks) : null,
    siteId: options.siteId,
    slug: entry.slug,
    sourceUpdatedAt: options.now,
    status: options.status ?? 'approved',
    updatedAt: options.now,
    website
  }
}
