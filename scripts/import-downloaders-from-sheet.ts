import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalTrialProductsSchema } from '@thedaviddias/site-contract/trial-product-schema'
import { parse as parseCsv } from 'csv-parse/sync'

export const EXPECTED_DOWNLOADER_ROW_COUNT = 214

export const ACTIVE_DOWNLOADER_SITE_IDS = [
  'browserextensions.io',
  'serp.co',
  'serp.ai',
  'serpdownloaders.com',
  'serp.software',
  'pornvideodownloaders.com'
] as const

type ActiveDownloaderSiteId = (typeof ACTIVE_DOWNLOADER_SITE_IDS)[number]

type RawDownloaderRow = {
  gh_private_source_code_repo?: string
  product_key?: string
  product_name?: string
  'product_website_link_serp.ly'?: string
  'product_website_link_serpx.link'?: string
  site?: string
  site_is_adult?: string
  status?: string
}

export type DownloaderRow = {
  githubSourceRepo: string
  productName: string
  serpLyUrl: string
  serpXUrl?: string
  site: string
  siteIsAdult: boolean
  slug: string
  status: string
}

export type ProductReadme = {
  body: string
  faq: Array<{
    answer: string
    question: string
  }>
  relatedLinks: Array<{
    label: string
    url: string
  }>
  tagline: string
}

export type DownloaderProduct = {
  content?: {
    body?: string
    faq?: Array<{
      answer: string
      question: string
    }>
  }
  featured?: boolean
  media?: {
    images?: string[]
    logo?: string
    video?: string
  }
  product: {
    categories?: string[]
    productPage: string
    slug: string
    tagline: string
    title: string
  }
  relatedLinks?: Array<{
    label: string
    url: string
  }>
}

type DownloaderProducts = Record<string, DownloaderProduct>

type ParseDownloaderRowsOptions = {
  expectedRowCount?: number
}

type BuildDownloaderProductOptions = {
  categories?: string[]
  featured?: boolean
}

type GithubRepoRef = {
  owner: string
  repo: string
}

const DEFAULT_CSV_PATH = 'tmp/SERP DB - ! Main Tables - Sheet55.csv'
const README_BODY_EXCLUDED_SECTION_TITLES = new Set([
  'faq',
  'license',
  'links',
  'preview',
  'table of contents'
])
const FORBIDDEN_HELP_CENTER_LINK_PATTERN = /\bhttps?:\/\/help\.serp\.co\/en(?:\/|(?=$)|[?#])/i

const SITE_PRODUCT_PATHS: Record<ActiveDownloaderSiteId, string> = {
  'browserextensions.io': 'sites/browserextensions.io/products.json',
  'pornvideodownloaders.com': 'sites/pornvideodownloaders.com/products.json',
  'serp.ai': 'sites/serp.ai/products.json',
  'serp.co': 'sites/serp.co/products.json',
  'serp.software': 'sites/serp.software/products.json',
  'serpdownloaders.com': 'sites/serpdownloaders.com/products.json'
}

const DEFAULT_IMPORT_PRODUCT_OPTIONS: BuildDownloaderProductOptions = {
  categories: ['adult', 'video-downloaders']
}

const SITE_PRODUCT_OPTIONS: Partial<Record<ActiveDownloaderSiteId, BuildDownloaderProductOptions>> =
  {
    'browserextensions.io': {
      categories: ['adult', 'video-downloaders'],
      featured: true
    },
    'serp.ai': {
      categories: ['adult', 'video-downloaders'],
      featured: true
    },
    'serp.co': {
      categories: ['adult', 'video-downloaders'],
      featured: true
    }
  }

function cleanString(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function sanitizeMdxText(value: string): string {
  return value
    .replaceAll('[\\[email protected\\]](/cdn-cgi/l/email-protection)', '\\[email protected\\]')
    .replaceAll(/(?<!!)\[([^\]\n]{1,120})\]\(\/cdn-cgi\/l\/email-protection\)/g, '$1')
    .replaceAll('/cdn-cgi/l/email-protection', 'email support')
    .replaceAll('\\`\\`\\`', '```')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function hasForbiddenHelpCenterLink(value: string): boolean {
  return FORBIDDEN_HELP_CENTER_LINK_PATTERN.test(value)
}

function cleanForbiddenHelpCenterLines(value?: string): string | undefined {
  const cleaned = normalizeMarkdownBlock(
    (value ?? '')
      .split('\n')
      .filter(line => !hasForbiddenHelpCenterLink(line))
      .join('\n')
  )

  return cleanString(cleaned)
}

function normalizeMarkdownBlock(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function requireField(row: RawDownloaderRow, field: keyof RawDownloaderRow, index: number): string {
  const value = cleanString(row[field])

  if (!value) {
    throw new Error(`Missing ${field} in downloader row ${index + 1}`)
  }

  return value
}

function assertValidUrl(value: string, message: string): void {
  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Unsupported protocol')
    }
  } catch {
    throw new Error(message)
  }
}

function normalizeGithubRepoUrl(value: string): string {
  assertValidUrl(value, `Invalid GitHub repo URL: ${value}`)

  const parsed = new URL(value)
  const parts = parsed.pathname
    .replace(/\.git$/, '')
    .split('/')
    .filter(Boolean)

  if (parsed.hostname !== 'github.com' || parts.length !== 2) {
    throw new Error(`Invalid GitHub repo URL: ${value}`)
  }

  return `https://github.com/${parts[0]}/${parts[1]}`
}

function assertSerpLyUrl(value: string, slug: string): void {
  assertValidUrl(value, `Invalid serp.ly URL for ${slug}: ${value}`)
  const parsed = new URL(value)

  if (parsed.hostname !== 'serp.ly' || parsed.pathname.replace(/^\/+|\/+$/g, '') !== slug) {
    throw new Error(`Invalid serp.ly URL for ${slug}: ${value}`)
  }
}

function assertSerpXUrl(value: string, slug: string): void {
  assertValidUrl(value, `Invalid serpx.link URL for ${slug}: ${value}`)
  const parsed = new URL(value)

  if (parsed.hostname !== 'serpx.link' || parsed.pathname.replace(/^\/+|\/+$/g, '') !== slug) {
    throw new Error(`Invalid serpx.link URL for ${slug}: ${value}`)
  }
}

export function parseDownloaderRows(
  csvText: string,
  options: ParseDownloaderRowsOptions = {}
): DownloaderRow[] {
  const rows = parseCsv(csvText, {
    bom: true,
    columns: true,
    skip_empty_lines: true
  }) as RawDownloaderRow[]

  if (options.expectedRowCount !== undefined && rows.length !== options.expectedRowCount) {
    throw new Error(`Expected ${options.expectedRowCount} downloader rows, found ${rows.length}`)
  }

  const seenSlugs = new Set<string>()
  const duplicateSlugs = new Set<string>()

  const parsedRows = rows.map((row, index): DownloaderRow => {
    const slug = requireField(row, 'product_key', index)
    const status = requireField(row, 'status', index)
    const siteIsAdult = requireField(row, 'site_is_adult', index)
    const site = requireField(row, 'site', index)
    const productName = requireField(row, 'product_name', index)
    const serpLyUrl = requireField(row, 'product_website_link_serp.ly', index)
    const rawSerpXUrl = cleanString(row['product_website_link_serpx.link'])
    const githubSourceRepo = normalizeGithubRepoUrl(
      requireField(row, 'gh_private_source_code_repo', index)
    )

    if (seenSlugs.has(slug)) {
      duplicateSlugs.add(slug)
    }
    seenSlugs.add(slug)

    if (status !== 'live') {
      throw new Error(`Expected status=live for ${slug}, found ${status}`)
    }

    if (siteIsAdult !== 'TRUE') {
      throw new Error(`Expected site_is_adult=TRUE for ${slug}, found ${siteIsAdult}`)
    }

    assertSerpLyUrl(serpLyUrl, slug)

    if (rawSerpXUrl) {
      assertSerpXUrl(rawSerpXUrl, slug)
    }

    return {
      githubSourceRepo,
      productName,
      serpLyUrl,
      serpXUrl: rawSerpXUrl,
      site,
      siteIsAdult: true,
      slug,
      status
    }
  })

  if (duplicateSlugs.size > 0) {
    throw new Error(`Duplicate product_key values: ${[...duplicateSlugs].sort().join(', ')}`)
  }

  return parsedRows
}

function titleKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[:!?.]+$/g, '')
}

function stripMarkdownLinkLabel(value: string): string {
  return value
    .replace(/^:+[a-z0-9_-]+:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function linkLabelFromReadme(label: string, url: string): string | undefined {
  const cleanedLabel = stripMarkdownLinkLabel(label)

  if (/serp\.ly\//.test(url) || /get it here/i.test(cleanedLabel)) {
    return undefined
  }

  if (/release/i.test(cleanedLabel)) {
    return 'Latest Release'
  }

  if (hasForbiddenHelpCenterLink(url)) {
    return undefined
  }

  if (/help|support/i.test(cleanedLabel)) {
    return 'Support'
  }

  if (/bug|issue/i.test(cleanedLabel)) {
    return 'GitHub Issues'
  }

  if (/feature/i.test(cleanedLabel)) {
    return 'Feature Requests'
  }

  return cleanedLabel || undefined
}

function splitReadmeSections(markdown: string): {
  intro: string
  sections: Array<{
    content: string
    title: string
  }>
  tagline: string
} {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const firstH2Index = lines.findIndex(line => /^##\s+/.test(line))
  const headerLines = firstH2Index === -1 ? lines : lines.slice(0, firstH2Index)
  const sectionLines = firstH2Index === -1 ? [] : lines.slice(firstH2Index)
  const tagline =
    headerLines
      .map(line => line.match(/^>\s*(.+?)\s*$/)?.[1])
      .find(Boolean)
      ?.trim() ?? ''
  const intro = normalizeMarkdownBlock(
    headerLines
      .filter(line => !/^#\s+/.test(line))
      .filter(line => !/^>\s*/.test(line))
      .join('\n')
  )
  const sections: Array<{
    content: string
    title: string
  }> = []
  let currentTitle: string | undefined
  let currentLines: string[] = []

  function flushSection(): void {
    if (!currentTitle) {
      return
    }

    sections.push({
      content: normalizeMarkdownBlock(currentLines.join('\n')),
      title: currentTitle
    })
  }

  for (const line of sectionLines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/)
    if (headingMatch) {
      flushSection()
      currentTitle = headingMatch[1] ?? ''
      currentLines = []
      continue
    }

    currentLines.push(line)
  }

  flushSection()

  return {
    intro,
    sections,
    tagline
  }
}

function extractReadmeLinks(
  sections: Array<{ content: string; title: string }>
): ProductReadme['relatedLinks'] {
  const linksSection = sections.find(section => titleKey(section.title) === 'links')
  const links: ProductReadme['relatedLinks'] = []
  const seenUrls = new Set<string>()
  const seenLabels = new Set<string>()

  if (!linksSection) {
    return links
  }

  for (const match of linksSection.content.matchAll(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const label = linkLabelFromReadme(match[1] ?? '', match[2] ?? '')
    const url = cleanString(match[2])
    const normalizedUrl = url?.replace(/\/+$/, '')

    if (!label || !url || !normalizedUrl || seenUrls.has(normalizedUrl) || seenLabels.has(label)) {
      continue
    }

    links.push({ label, url })
    seenUrls.add(normalizedUrl)
    seenLabels.add(label)
  }

  return links
}

function extractFaq(section?: { content: string; title: string }): ProductReadme['faq'] {
  if (!section) {
    return []
  }

  const faq: ProductReadme['faq'] = []
  const lines = section.content.split('\n')
  let currentQuestion: string | undefined
  let currentAnswerLines: string[] = []

  function flushFaq(): void {
    const answer = normalizeMarkdownBlock(currentAnswerLines.join('\n'))

    if (currentQuestion && answer && !hasForbiddenHelpCenterLink(`${currentQuestion}\n${answer}`)) {
      faq.push({
        answer: sanitizeMdxText(answer),
        question: sanitizeMdxText(currentQuestion)
      })
    }
  }

  for (const line of lines) {
    const boldQuestion = line.match(/^\*\*(.+?)\*\*\s*$/)
    const headingQuestion = line.match(/^###\s+(.+?)\s*$/)
    const nextQuestion = boldQuestion?.[1] ?? headingQuestion?.[1]

    if (nextQuestion) {
      flushFaq()
      currentQuestion = nextQuestion.trim()
      currentAnswerLines = []
      continue
    }

    currentAnswerLines.push(line)
  }

  flushFaq()

  return faq
}

export function parseProductReadme(markdown: string): ProductReadme {
  const { intro, sections, tagline } = splitReadmeSections(markdown)
  const bodySections: string[] = []
  const cleanedTagline = cleanString(tagline)
  const overview = cleanString(intro) ?? cleanedTagline
  const faqSection = sections.find(section => titleKey(section.title) === 'faq')
  const faq = extractFaq(faqSection)

  if (overview) {
    bodySections.push(`## Overview\n\n${overview}`)
  }

  for (const section of sections) {
    if (README_BODY_EXCLUDED_SECTION_TITLES.has(titleKey(section.title))) {
      continue
    }

    const content = cleanString(section.content)
    if (content) {
      bodySections.push(`## ${section.title}\n\n${content}`)
    }
  }

  const body = sanitizeMdxText(normalizeMarkdownBlock(bodySections.join('\n\n')))
  const relatedLinks = extractReadmeLinks(sections)

  if (!cleanedTagline) {
    throw new Error('README is missing a source-backed blockquote tagline')
  }

  if (!body) {
    throw new Error('README is missing source-backed body content')
  }

  if (faq.length < 3) {
    throw new Error('README is missing at least 3 FAQ entries')
  }

  return {
    body,
    faq,
    relatedLinks,
    tagline: sanitizeMdxText(cleanedTagline)
  }
}

function addUniqueLink(
  links: ProductReadme['relatedLinks'],
  seenUrls: Set<string>,
  seenLabels: Set<string>,
  label: string,
  url?: string
): void {
  const cleanUrl = cleanString(url)
  const normalizedUrl = cleanUrl?.replace(/\/+$/, '')

  if (
    !cleanUrl ||
    !normalizedUrl ||
    hasForbiddenHelpCenterLink(cleanUrl) ||
    seenUrls.has(normalizedUrl) ||
    seenLabels.has(label)
  ) {
    return
  }

  links.push({ label, url: cleanUrl })
  seenUrls.add(normalizedUrl)
  seenLabels.add(label)
}

export function buildDownloaderProduct(
  row: DownloaderRow,
  readme: ProductReadme,
  options: BuildDownloaderProductOptions = {}
): DownloaderProduct {
  const relatedLinks: ProductReadme['relatedLinks'] = []
  const seenUrls = new Set<string>()
  const seenLabels = new Set<string>()

  addUniqueLink(relatedLinks, seenUrls, seenLabels, 'Install browser extension', row.serpLyUrl)
  addUniqueLink(relatedLinks, seenUrls, seenLabels, 'SERPX', row.serpXUrl)
  addUniqueLink(
    relatedLinks,
    seenUrls,
    seenLabels,
    'SERP',
    `https://serp.co/products/${row.slug}/reviews/`
  )
  addUniqueLink(
    relatedLinks,
    seenUrls,
    seenLabels,
    'SERP AI',
    `https://serp.ai/products/${row.slug}/reviews/`
  )
  addUniqueLink(
    relatedLinks,
    seenUrls,
    seenLabels,
    'Browser Extensions',
    `https://browserextensions.io/products/${row.slug}/`
  )

  for (const link of readme.relatedLinks) {
    addUniqueLink(relatedLinks, seenUrls, seenLabels, link.label, link.url)
  }

  return canonicalTrialProductsSchema.parse({
    [row.slug]: {
      ...(options.featured !== undefined ? { featured: options.featured } : {}),
      content: {
        body: readme.body,
        faq: readme.faq
      },
      product: {
        ...(options.categories ? { categories: options.categories } : {}),
        productPage: row.serpLyUrl,
        slug: row.slug,
        tagline: readme.tagline,
        title: row.productName
      },
      relatedLinks
    }
  })[row.slug] as DownloaderProduct
}

function contentScore(product: DownloaderProduct | undefined): number {
  if (!product) {
    return 0
  }

  return (product.content?.body?.length ?? 0) + (product.content?.faq?.length ?? 0) * 400
}

function mergeRelatedLinks(
  existingLinks?: DownloaderProduct['relatedLinks'],
  importedLinks?: DownloaderProduct['relatedLinks']
): DownloaderProduct['relatedLinks'] {
  const links: NonNullable<DownloaderProduct['relatedLinks']> = []
  const seenUrls = new Set<string>()
  const seenLabels = new Set<string>()

  for (const link of [...(importedLinks ?? []), ...(existingLinks ?? [])]) {
    addUniqueLink(links, seenUrls, seenLabels, link.label, link.url)
  }

  return links.length > 0 ? links : undefined
}

function cleanMedia(media?: DownloaderProduct['media']): DownloaderProduct['media'] {
  if (!media) {
    return undefined
  }

  const images = media.images?.filter(image => cleanString(image))
  const logo = cleanString(media.logo)
  const video = cleanString(media.video)

  if (!images?.length && !logo && !video) {
    return undefined
  }

  return {
    ...(images?.length ? { images } : {}),
    ...(logo ? { logo } : {}),
    ...(video ? { video } : {})
  }
}

function cleanDownloaderProduct(product: DownloaderProduct): DownloaderProduct {
  const media = cleanMedia(product.media)
  const faq = product.content?.faq?.filter(
    item => !hasForbiddenHelpCenterLink(`${item.question}\n${item.answer}`)
  )
  const body = cleanForbiddenHelpCenterLines(product.content?.body)
  const content = product.content
    ? {
        ...(body ? { body } : {}),
        ...(faq?.length ? { faq } : {})
      }
    : undefined
  const relatedLinks = mergeRelatedLinks(undefined, product.relatedLinks)

  return {
    ...(content ? { content } : {}),
    ...(product.featured !== undefined ? { featured: product.featured } : {}),
    ...(media ? { media } : {}),
    product: product.product,
    ...(relatedLinks?.length ? { relatedLinks } : {})
  }
}

function mergeDownloaderProduct(
  existing: DownloaderProduct | undefined,
  imported: DownloaderProduct
): DownloaderProduct {
  const cleanExisting = existing ? cleanDownloaderProduct(existing) : undefined

  if (!cleanExisting) {
    return imported
  }

  const useImportedContent = contentScore(imported) >= contentScore(cleanExisting)
  const contentSource = useImportedContent ? imported : cleanExisting

  return canonicalTrialProductsSchema.parse({
    [imported.product.slug]: {
      ...(imported.featured !== undefined || cleanExisting.featured !== undefined
        ? { featured: imported.featured ?? cleanExisting.featured }
        : {}),
      ...(contentSource.content ? { content: contentSource.content } : {}),
      ...(imported.media || cleanExisting.media
        ? { media: imported.media ?? cleanExisting.media }
        : {}),
      product: {
        ...(imported.product.categories || cleanExisting.product.categories
          ? { categories: imported.product.categories ?? cleanExisting.product.categories }
          : {}),
        productPage: imported.product.productPage,
        slug: imported.product.slug,
        tagline: useImportedContent ? imported.product.tagline : cleanExisting.product.tagline,
        title: imported.product.title
      },
      relatedLinks: mergeRelatedLinks(cleanExisting.relatedLinks, imported.relatedLinks)
    }
  })[imported.product.slug] as DownloaderProduct
}

export function mergeDownloaderProducts(
  existingProducts: DownloaderProducts,
  importedProducts: DownloaderProducts
): DownloaderProducts {
  const mergedProducts: DownloaderProducts = {}

  for (const [slug, product] of Object.entries(existingProducts)) {
    mergedProducts[slug] = importedProducts[slug]
      ? mergeDownloaderProduct(product, importedProducts[slug])
      : cleanDownloaderProduct(product)
  }

  for (const [slug, product] of Object.entries(importedProducts)) {
    if (!mergedProducts[slug]) {
      mergedProducts[slug] = product
    }
  }

  return canonicalTrialProductsSchema.parse(mergedProducts) as DownloaderProducts
}

export function validateDownloaderImport(
  siteProducts: Record<ActiveDownloaderSiteId, DownloaderProducts>
): void {
  for (const siteId of ACTIVE_DOWNLOADER_SITE_IDS) {
    if (!siteProducts[siteId]) {
      throw new Error(`Missing imported products for ${siteId}`)
    }
  }
}

function parseGithubRepoRef(repoUrl: string): GithubRepoRef {
  const normalizedUrl = normalizeGithubRepoUrl(repoUrl)
  const parsed = new URL(normalizedUrl)
  const [owner, repo] = parsed.pathname.split('/').filter(Boolean)

  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repo URL: ${repoUrl}`)
  }

  return { owner, repo }
}

function getGithubToken(): string | undefined {
  try {
    return cleanString(execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }))
  } catch {
    return undefined
  }
}

async function fetchGithubReadme(row: DownloaderRow, token?: string): Promise<string> {
  const { owner, repo } = parseGithubRepoRef(row.githubSourceRepo)
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'json-directory-downloader-importer',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch README for ${row.slug}: ${response.status} ${response.statusText}`
    )
  }

  const payload = (await response.json()) as {
    content?: string
    encoding?: string
  }

  if (payload.encoding !== 'base64' || !payload.content) {
    throw new Error(`README response for ${row.slug} did not include base64 content`)
  }

  return Buffer.from(payload.content, 'base64').toString('utf8')
}

async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<U>
): Promise<U[]> {
  const results = new Array<U>(values.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(values[index] as T, index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()))

  return results
}

async function buildImportedProducts(
  rows: DownloaderRow[]
): Promise<Record<ActiveDownloaderSiteId, DownloaderProducts>> {
  const token = getGithubToken()
  const productsBySite = Object.fromEntries(
    ACTIVE_DOWNLOADER_SITE_IDS.map(siteId => [siteId, {}])
  ) as Record<ActiveDownloaderSiteId, DownloaderProducts>

  const readmes = await mapWithConcurrency(rows, 4, async (row, index) => {
    const readme = await fetchGithubReadme(row, token)
    console.log(`Fetched README ${index + 1}/${rows.length}: ${row.slug}`)
    return parseProductReadme(readme)
  })

  for (const [index, row] of rows.entries()) {
    const readme = readmes[index] as ProductReadme

    for (const siteId of ACTIVE_DOWNLOADER_SITE_IDS) {
      productsBySite[siteId][row.slug] = buildDownloaderProduct(row, readme, {
        ...DEFAULT_IMPORT_PRODUCT_OPTIONS,
        ...SITE_PRODUCT_OPTIONS[siteId]
      })
    }
  }

  return productsBySite
}

function readProducts(path: string): DownloaderProducts {
  const products = JSON.parse(readFileSync(resolve(path), 'utf8')) as DownloaderProducts
  const cleanedProducts = Object.fromEntries(
    Object.entries(products).map(([slug, product]) => [slug, cleanDownloaderProduct(product)])
  )

  return canonicalTrialProductsSchema.parse(cleanedProducts) as DownloaderProducts
}

function writeProducts(path: string, products: DownloaderProducts): void {
  writeFileSync(resolve(path), `${JSON.stringify(products, null, 2)}\n`)
}

function readCliOption(name: string): string | undefined {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

export async function importDownloadersFromSheet({
  csvPath = DEFAULT_CSV_PATH
}: {
  csvPath?: string
} = {}): Promise<Record<ActiveDownloaderSiteId, DownloaderProducts>> {
  const rows = parseDownloaderRows(readFileSync(resolve(csvPath), 'utf8'), {
    expectedRowCount: EXPECTED_DOWNLOADER_ROW_COUNT
  })
  const importedProducts = await buildImportedProducts(rows)
  const mergedProducts = Object.fromEntries(
    ACTIVE_DOWNLOADER_SITE_IDS.map(siteId => {
      return [
        siteId,
        mergeDownloaderProducts(readProducts(SITE_PRODUCT_PATHS[siteId]), importedProducts[siteId])
      ]
    })
  ) as Record<ActiveDownloaderSiteId, DownloaderProducts>

  validateDownloaderImport(mergedProducts)

  for (const siteId of ACTIVE_DOWNLOADER_SITE_IDS) {
    writeProducts(SITE_PRODUCT_PATHS[siteId], mergedProducts[siteId])
    console.log(
      `Wrote ${Object.keys(mergedProducts[siteId]).length} products to ${SITE_PRODUCT_PATHS[siteId]}`
    )
  }

  return mergedProducts
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importDownloadersFromSheet({
    csvPath: readCliOption('--csv') ?? DEFAULT_CSV_PATH
  }).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
