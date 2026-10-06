import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { type ParseError, parse as parseJsonc } from 'jsonc-parser'

/**
 * Shared helpers for reading apps.serp.co product data from a
 * `serpcompany/store-new` checkout (`apps/serp-apps/data/products/*.json[c]`).
 */

export const STORE_NEW_PRODUCTS_SUBDIR = 'apps/serp-apps/data/products'
export const STORE_NEW_DIR_ENV = 'STORE_NEW_DIR'

export type SourceProduct = {
  benefits?: string[]
  categories?: string[]
  compatibility_sections?: Array<{
    items?: string[]
    title?: string
    variant?: string
  }>
  description?: string
  faqs?: Array<{
    answer?: string
    question?: string
  }>
  featured_image?: string
  featured_image_gif?: string
  features?: string[]
  github_repo_url?: string | null
  how_it_works?: Array<{
    description?: string
    title?: string
  }>
  limitations?: string[]
  name?: string
  permission_justifications?: Array<{
    justification?: string
    permission?: string
  }>
  platform?: string
  resource_links?: Array<{
    href?: string
    label?: string
    title?: string
    url?: string
  }>
  reviews?: Array<{
    name?: string
    rating?: number
    review?: string
    title?: string
  }>
  screenshots?: Array<{
    url?: string
  }>
  serply_link?: string
  slug?: string
  status?: string
  supported_operating_systems?: string[]
  supported_regions?: string[]
  tagline?: string
}

export type SourceProductFile = {
  file: string
  product: SourceProduct
}

export function cleanString(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function markdownList(items?: string[]): string | undefined {
  const cleaned = items?.map(cleanString).filter(Boolean) as string[] | undefined
  return cleaned?.length ? cleaned.map(item => `- ${item}`).join('\n') : undefined
}

export function markdownParagraphs(value?: string): string | undefined {
  const cleaned = cleanString(value)
  return cleaned?.replace(/\n{3,}/g, '\n\n')
}

export function addSection(sections: string[], title: string, body?: string): void {
  const cleaned = cleanString(body)
  if (cleaned) {
    sections.push(`## ${title}\n\n${cleaned}`)
  }
}

export function isProductSpecificGithub(url: string): boolean {
  return /^https:\/\/github\.com\/serpapps\/[^/]+/.test(url) && basename(url).includes('downloader')
}

/**
 * Resolve the products directory from either a store-new checkout root or the
 * products directory itself. Falls back to the STORE_NEW_DIR env var.
 */
export function resolveStoreNewProductsDir(
  value: string | undefined = process.env[STORE_NEW_DIR_ENV]
): string {
  const cleaned = cleanString(value)
  if (!cleaned) {
    throw new Error(
      `Pass --source-dir <store-new checkout or products dir> or set ${STORE_NEW_DIR_ENV}.`
    )
  }

  const candidate = resolve(cleaned)
  const nested = join(candidate, STORE_NEW_PRODUCTS_SUBDIR)
  if (existsSync(nested) && statSync(nested).isDirectory()) {
    return nested
  }

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return candidate
  }

  throw new Error(`Source directory not found: ${candidate}`)
}

export function listSourceProductFiles(dir: string): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter(file => file.endsWith('.json') || file.endsWith('.jsonc'))
        .sort()
    : []
}

export function readSourceProductFile(path: string): SourceProduct {
  const errors: ParseError[] = []
  const product = parseJsonc(readFileSync(path, 'utf8'), errors, {
    allowTrailingComma: true
  }) as SourceProduct
  if (errors.length > 0) {
    throw new Error(`Could not parse ${path}: ${errors.length} JSONC error(s)`)
  }
  return product
}

/** Read every `.json` / `.jsonc` product file in a directory. */
export function readSourceProductFiles(dir: string): SourceProductFile[] {
  return listSourceProductFiles(dir).map(file => ({
    file,
    product: readSourceProductFile(join(dir, file))
  }))
}
