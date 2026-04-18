import fs from 'node:fs'
import path from 'node:path'
import {
  applyLegalContentBranding,
  buildDocs,
  buildGuides,
  buildWebsiteMetadata,
  resolveAboutPage,
  resolveDocBySlug,
  resolveGuideBySlug,
  resolveWebsiteBySlug,
} from '@thedaviddias/web-core/content-query'
import type {
  AboutPageEntry,
  AboutPageMetadata as AppAboutPageMetadata,
  ContentMeta,
  DocEntry,
  DocMetadata as AppDocMetadata,
  GuideEntry,
  GuideMetadata as AppGuideMetadata,
  LegalEntry,
  WebsiteMetadata as AppWebsiteMetadata,
} from '@thedaviddias/web-core/content-query'
import { siteConfig } from '@thedaviddias/web-core/site-config'
import { resolveFromRoot } from './server-utils'

export type {
  AboutPageMetadata,
  DocMetadata,
  GuideMetadata,
  WebsiteMetadata,
} from '@thedaviddias/web-core/content-query'

interface Resource {
  slug?: string
  title: string
  description: string
  url?: string
  category: string
  icon?: string
  featured?: boolean
  content?: string
  _meta?: ContentMeta
}

let allGuides: GuideEntry[] = []
let allLegals: LegalEntry[] = []
let allResources: Resource[] = []
let allDocs: DocEntry[] = []
let allAboutPages: AboutPageEntry[] = []
let allJsonWebsites: unknown = []

try {
  const collections = require('@/.content-collections/generated')
  allGuides = (collections.allGuides || []) as GuideEntry[]
  allLegals = (collections.allLegals || []) as LegalEntry[]
  allResources = (collections.allResources || []) as Resource[]
  allDocs = (collections.allDocs || []) as DocEntry[]
  allAboutPages = (collections.allAboutPages || []) as AboutPageEntry[]
} catch {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('Content collections not available, using empty arrays')
  }
}

try {
  allJsonWebsites = require('../../../data/listings.json')
} catch {
  allJsonWebsites = []
}

function readLegalContentFromFileSystem(key: string): string {
  const legalFilePath = path.join(
    resolveFromRoot('packages/content/data/legal'),
    `${key}.mdx`
  )

  if (!fs.existsSync(legalFilePath)) {
    return ''
  }

  return fs.readFileSync(legalFilePath, 'utf8')
}

export function getWebsites(): AppWebsiteMetadata[] {
  return buildWebsiteMetadata(allJsonWebsites)
}

export async function getWebsiteBySlug(slug: string) {
  return resolveWebsiteBySlug(getWebsites(), slug)
}

export function getGuides(): AppGuideMetadata[] {
  return buildGuides(allGuides)
}

export async function getGuideBySlug(slug: string): Promise<AppGuideMetadata | null> {
  return resolveGuideBySlug(allGuides, slug)
}

export async function getLegalContent(key: string): Promise<string> {
  const legal = allLegals.find(entry => entry._meta?.path === key)
  const content =
    legal?.content ||
    legal?._meta?.content ||
    readLegalContentFromFileSystem(key)

  if (!content) {
    throw new Error(`Legal content "${key}" not found`)
  }

  return applyLegalContentBranding(content, {
    domain: siteConfig.domain,
    siteName: siteConfig.name,
  })
}

export function getResources() {
  return allResources
}

export async function getResourceBySlug(slug: string) {
  const resource = allResources.find(entry => entry.slug === slug)

  if (!resource) {
    return null
  }

  const content = resource.content || resource._meta?.content || ''

  return {
    ...resource,
    content,
  }
}

export function getDocs(): AppDocMetadata[] {
  return buildDocs(allDocs)
}

export async function getDocBySlug(slug: string): Promise<AppDocMetadata | null> {
  return resolveDocBySlug(allDocs, slug)
}

export async function getAboutPage(): Promise<AppAboutPageMetadata | null> {
  return resolveAboutPage(allAboutPages)
}
