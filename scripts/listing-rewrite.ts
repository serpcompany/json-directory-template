/**
 * Listing rewrite pipeline: prepare -> (rewriter subagents) -> check -> apply.
 *
 * Follows the "Unique content rule" in docs/knowledge/listing-data-contract.md and
 * the workflow in serpcompany/json-directory-template#156. The rewrite step itself
 * is done by Claude Code rewriter subagents; this script never calls a model API.
 *
 *   pnpm tsx scripts/listing-rewrite.ts diff    --source-dir ../store-new
 *   pnpm tsx scripts/listing-rewrite.ts prepare --source-dir ../store-new [--slugs a,b] [--limit 20]
 *   pnpm tsx scripts/listing-rewrite.ts prepare --existing --slugs a,b   (rewrite existing listings, #157)
 *   pnpm tsx scripts/listing-rewrite.ts check   [--slugs a,b]
 *   pnpm tsx scripts/listing-rewrite.ts apply   [--slugs a,b]
 *
 * Options:
 *   --source-dir <dir>   store-new checkout or its apps/serp-apps/data/products dir (or STORE_NEW_DIR)
 *   --site <id>          target site (default browserextensions.io)
 *   --work-dir <dir>     inputs/outputs root (default tmp/listing-rewrites)
 *   --exclude a,b        extra slugs to skip
 *   --exclude-file <f>   newline-separated slugs to skip (default scripts/listing-rewrite-excluded.txt)
 *   --replace            apply: overwrite listings already in products.json; prepare (with
 *                        --slugs): re-prepare listings this pipeline already applied
 *   --threshold <n>      similarity ceiling, 0 < n <= 0.5 (default 0.5)
 *   --source-rev <sha>   store-new commit the source dir was read from (recorded in diff.json)
 *   --source-git <dir>   store-new git checkout; with --source-rev it breaks ties between
 *                        two source files for one slug (the file with the newer commit wins)
 *   --no-verify-links    prepare: skip the HTTP check of links and images (apply then refuses
 *                        the inputs). By default prepare HEAD-checks every GitHub link, install
 *                        link, SERP Apps page and image; it drops GitHub / Latest Release links
 *                        and images that don't answer 2xx/3xx, and skips a slug whose install
 *                        link or SERP Apps page doesn't.
 *
 * Rewriter subagents get scripts/listing-rewrite-brief.md plus their input files.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addSection,
  cleanString,
  isProductSpecificGithub,
  markdownList,
  markdownParagraphs,
  readSourceProductFiles,
  resolveStoreNewProductsDir,
  type SourceProduct,
  type SourceProductFile,
  STORE_NEW_PRODUCTS_SUBDIR,
  stripHtml
} from './store-new-products.ts'

// ---------------------------------------------------------------------------
// Types

export type FaqEntry = { answer: string; question: string }

export type RelatedLink = { label: string; url: string }

export type SiteProduct = {
  content?: { body?: string; faq?: FaqEntry[] }
  featured?: boolean
  media?: { images?: string[]; logo?: string; video?: string }
  product?: {
    categories?: string[]
    legacySlugs?: string[]
    productPage?: string
    slug?: string
    tagline?: string
    title?: string
  }
  relatedLinks?: RelatedLink[]
}

export type SiteProducts = Record<string, SiteProduct>

export type Facts = {
  browsers: string[]
  folder: boolean
  formats: string[]
  limitationTerms: string[]
  numbers: string[]
  operatingSystems: string[]
  permissions: string[]
  platform: string
  quality: string[]
  regions: string[]
  savePaths: string[]
}

export type LinkCheck = {
  checkedAt: string
  droppedImages: string[]
  droppedLinks: string[]
}

export type RewriteInput = {
  entry: {
    categories: string[]
    featured: boolean
    images: string[]
    productPage: string
    relatedLinks: RelatedLink[]
    title: string
  }
  /** Contradictions inside the source product data, for the owner to resolve. */
  conflicts?: string[]
  facts: Facts
  /** Set by prepare's link verification; apply refuses new listings without it. */
  linkCheck?: LinkCheck
  mode: 'new' | 'existing'
  names: string[]
  site: string
  slug: string
  source: {
    body: string
    faq: FaqEntry[]
    tagline: string
  }
  sourceFile?: string
}

export type RewriteOutput = {
  body: string
  faq: FaqEntry[]
  slug: string
  tagline: string
}

export type Score = { jaccard: number; ratio: number }

export type CheckResult = {
  /** sha256 of the input and output files the result was computed from. */
  hash?: string
  issues: string[]
  pass: boolean
  scores: {
    bodyVsOtherListings?: Score & { slug: string }
    bodyVsOtherSites?: Record<string, Score>
    bodyVsSource: Score
    faqVsSource: Score
    taglineVsSource: Score
  }
  slug: string
  threshold?: number
}

// ---------------------------------------------------------------------------
// Constants

export const APPS_ORIGIN = 'https://apps.serp.co'
export const DEFAULT_SITE = 'browserextensions.io'
export const DEFAULT_THRESHOLD = 0.5
export const DEFAULT_WORK_DIR = 'tmp/listing-rewrites'
export const DEFAULT_EXCLUDE_FILE = 'scripts/listing-rewrite-excluded.txt'
export const FACT_OVERRIDES_FILE = 'scripts/listing-rewrite-fact-overrides.json'
export const SOURCE_OVERRIDES_FILE = 'scripts/listing-rewrite-source-overrides.json'
/** Live apps.serp.co products that aren't browser extensions (owner decision on #156). */
export const NOT_EXTENSIONS = new Set(['serp-downloaders-bundle'])
export const LEGAL_QUESTION = 'Is this legal?'
/** Shortest sentence compared across listings (short fact lists repeat legitimately). */
export const MIN_SHARED_SENTENCE_WORDS = 8
/** Shortest sentence that may not be copied from the source. */
export const MIN_SOURCE_COPY_WORDS = 6
/** How many nearest listings (by 3-word shingles) get the exact LCS ratio. */
export const OTHER_LISTING_RATIO_CANDIDATES = 10
/** FAQ questions this close (word LCS ratio, names removed) to another listing's fail. */
export const QUESTION_SIMILARITY_LIMIT = 0.8
/** Fail when this share of a listing's headings / step labels appear in one other listing. */
export const STRUCTURE_OVERLAP_LIMIT = 0.5

/** apps.serp.co category -> browserextensions.io category slug (null = drop). Issue #156. */
export const CATEGORY_MAP: Record<string, string | null> = {
  Adult: 'adult',
  'Video Downloader': 'video-downloaders',
  'Fans Downloaders': 'fansite-downloaders',
  'Course Platforms': 'course-platform-downloaders',
  'Social Media': 'social-media-downloaders',
  Downloader: null,
  Utilities: null,
  'Privacy & Security': null
}

/** resource_links labels that are carried over as related links (matches existing listings). */
export const ALLOWED_RESOURCE_LINK_LABELS = new Set([
  'Apify',
  'Chrome Web Store',
  'ExtensionHub',
  'Firefox Add-ons',
  'Firefox Store',
  'Open Collective',
  'Product Hunt',
  'Reddit',
  'SERP Extensions'
])

const BROWSER_PATTERNS: Array<[string, RegExp]> = [
  ['Chrome', /\bChrome\b(?!\s*OS)/],
  ['Firefox', /\bFirefox\b/],
  ['Edge', /\bEdge\b/],
  ['Brave', /\bBrave\b/],
  ['Opera', /\bOpera\b/],
  ['Whale', /\bWhale\b/],
  ['Yandex', /\bYandex\b/],
  ['Safari', /\bSafari\b/],
  ['Vivaldi', /\bVivaldi\b/],
  ['Chromium', /\bChromium\b/]
]

const OS_PATTERNS: Array<[string, RegExp]> = [
  ['Windows', /\bWindows\b/],
  ['macOS', /\bmac(?:OS)?\b|\bMac\b/i],
  ['Linux', /\bLinux\b/],
  ['ChromeOS', /\bChrome\s*OS\b/i],
  ['Android', /\bAndroid\b/],
  ['iOS', /\biOS\b|\biPhone\b|\biPad\b/]
]

const SUPPORTED_SYSTEM_NAMES: Record<string, string> = {
  brave: 'Brave',
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  linux: 'Linux',
  mac: 'macOS',
  opera: 'Opera',
  whale: 'Whale',
  windows: 'Windows',
  yandex: 'Yandex'
}

const FORMAT_PATTERNS: Array<[string, RegExp]> = [
  ['MP4', /\bmp4\b/i],
  ['MP3', /\bmp3\b/i],
  ['M4A', /\bm4a\b/i],
  ['WebM', /\bwebm\b/i],
  ['MKV', /\bmkv\b/i],
  ['MOV', /\bMOV\b/],
  ['AVI', /\bavi\b/i],
  ['FLV', /\bflv\b/i],
  ['GIF', /\bgifs?\b/i],
  ['JPG', /\bjpe?g\b/i],
  ['PNG', /\bpng\b/i],
  ['WebP', /\bwebp\b/i],
  ['ZIP', /\bzip\b/i],
  ['HLS', /\bhls\b/i],
  ['M3U8', /\bm3u8\b/i],
  ['DASH', /\bDASH\b/],
  ['AAC', /\baac\b/i],
  ['WAV', /\bwav\b/i],
  ['PDF', /\bpdf\b/i]
]

/**
 * Pricing and trial language. Owner decision on #156: listings carry no prices, plans,
 * trial terms or free-download counts, so `check` fails any rewrite that contains these, and
 * facts are extracted from source text with them blanked out.
 */
export const PRICING_PATTERNS: Array<[string, RegExp]> = [
  ['price', /\$\s?\d|\bpric(?:e|es|ed|ing)\b|\bcosts?\b|\bpayments?\b|\bbilling\b/i],
  [
    'subscription plan',
    /\bsubscription (?:plans?|prices?|fees?|billing|tiers?)\b|\b(?:paid|monthly|annual|yearly) subscriptions?\b|\bsubscribe to (?:a|the) (?:plan|pro|premium)\b/i
  ],
  ['one-time', /\bone[- ]time (?:payment|purchase|fee|price|charge)\b/i],
  ['lifetime', /\blifetime (?:access|license|licence|updates|deal|plan)\b/i],
  ['trial', /\btrials?\b/i],
  ['credit card', /\bcredit cards?\b/i],
  ['refund', /\brefunds?\b|\bmoney[- ]back\b/i],
  ['discount', /\bdiscounts?\b|\bcoupons?\b/i],
  [
    'free downloads',
    /\b(?:free|complimentary)\b[^.\n]{0,20}\bdownloads?\b|\b\d+ (?:free |trial )?downloads\b|\b(?:two|three|four|five|ten) (?:free |trial )?downloads\b/i
  ],
  ['unlimited use', /\bunlimited (?:downloads|use|access|usage)\b/i],
  ['paid plan', /\b(?:paid|premium|pro) (?:plans?|versions?|tiers?|licen[cs]es?)\b/i],
  ['purchase decision', /\bbefore (?:subscribing|purchasing|buying|paying|committing)\b/i],
  ['free to try', /\btry (?:it )?(?:for )?free\b|\bfree (?:to try|version|plan|tier)\b/i],
  [
    'usage allowance',
    /\b(?:\d+|two|three|four|five|ten) (?:free |trial |permitted |included |complimentary )+(?:pages|videos|downloads|saves|files|recordings|clips|captures)\b/i
  ],
  [
    'test allowance',
    /\b(?:test|try)\b[^.\n]{0,40}\b(?:\d+|two|three|four|five|ten)\b[^.\n]{0,30}\b(?:pages|videos|downloads|saves|captures|recordings|clips)\b/i
  ]
]

/** FAQ entries about pricing or trials; they are neither rewritten nor counted. */
export function isPricingFaq(entry: FaqEntry): boolean {
  return pricingLanguage(`${entry.question}\n${entry.answer}`).length > 0
}

/** Pricing / trial phrases found in `text`. */
export function pricingLanguage(text: string): string[] {
  return PRICING_PATTERNS.flatMap(([label, pattern]) => {
    const match = text.match(new RegExp(pattern.source, 'i'))
    return match ? [`${label} ("${match[0]}")`] : []
  })
}

/** `text` with pricing / trial phrases blanked out, so facts never require them. */
/**
 * Drops a "## Reviews" section (star-rated testimonials). The brief bans reviews and
 * testimonials in rewrites, so their ratings and quoted numbers are not product facts (#161).
 */
export function withoutReviews(body: string): string {
  return body
    .replace(/(^|\n)##\s+Reviews\s*\n[\s\S]*?(?=\n##\s|$)/i, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const CODE_REFERENCE = /`?[\w./-]+\.(?:js|mjs|ts|json):\d+(?:[-:]\d+)?(?:,\s*\d+(?:-\d+)?)*`?/g
const PIPELINE_LABEL = /\b(?:pass|lineup|batch)-\d+\b|\blineups?\b|\bCSV\b/i

/**
 * Drops source code references (`background.js:69`) and every sentence that only carries
 * internal pipeline status, so their numbers are not demanded as product facts (#161).
 */
export function withoutInternalNotes(text: string): string {
  return text
    .replace(CODE_REFERENCE, '')
    .split('\n')
    .map(line =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter(sentence => !PIPELINE_LABEL.test(sentence) && pipelineNotes(sentence).length === 0)
        .join(' ')
    )
    .join('\n')
}

export function withoutPricing(text: string): string {
  return text
    .split('\n')
    .map(line => {
      // Keep a list item's label ("- storage:") so permission names survive.
      const label =
        line.match(/^\s*(?:[-*]|\d+\.)\s+(?:\*\*)?[^:\n]{1,100}?(?:\*\*)?:\s*/)?.[0] ?? ''
      const sentences = line.slice(label.length).split(/(?<=[.!?])\s+/)
      const kept = sentences.filter(sentence => pricingLanguage(sentence).length === 0)
      return kept.length === sentences.length ? line : `${label}${kept.join(' ')}`
    })
    .join('\n')
}

const LIMITATION_PATTERNS: Array<[string, RegExp]> = [
  ['Safari', /\bSafari\b/],
  ['mobile', /\bmobile\b/i],
  ['DRM', /\bDRM\b/],
  ['bypass', /\bbypass/i],
  ['live stream', /\blive[- ]?stream/i],
  ['login', /\blog(?:-| )?ins?\b|\bsign(?:-| )?in\b/i],
  ['age gate', /\bage[- ]gat/i]
]

/** Extension permission names as they appear in manifest / permission_justifications. */
const PERMISSION_NAMES = [
  'activeTab',
  'alarms',
  'contextMenus',
  'cookies',
  'declarativeNetRequest',
  'declarativeNetRequestWithHostAccess',
  'downloads',
  'host_permissions',
  'identity',
  'nativeMessaging',
  'notifications',
  'offscreen',
  'scripting',
  'sidePanel',
  'storage',
  'tabs',
  'unlimitedStorage',
  'webNavigation',
  'webRequest'
]

const WORD_NUMBERS: Record<string, string> = {
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12'
}

// ---------------------------------------------------------------------------
// Text helpers

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function namesForSource(source: { name?: string; platform?: string; title?: string }) {
  const names = new Set<string>()
  for (const value of [source.platform, source.name, source.title]) {
    const cleaned = cleanString(value)
    if (!cleaned) continue
    names.add(cleaned)
    const stripped = cleaned.replace(/\s+(?:bulk\s+)?(?:video\s+)?downloader$/i, '').trim()
    if (stripped) names.add(stripped)
  }
  return [...names].sort((a, b) => b.length - a.length)
}

function namePattern(name: string, flags = 'gi'): RegExp {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(name)}(?![A-Za-z0-9])`, flags)
}

function stripNames(text: string, names: string[]): string {
  let result = text
  for (const name of names) {
    result = result.replace(namePattern(name), ' platformname ')
  }
  return result
}

/** Lowercased word tokens with markdown, punctuation and product names removed. */
export function normalizeWords(text: string, names: string[] = []): string[] {
  return stripNames(text, names)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function shingles(words: string[], size = 5): Set<string> {
  const result = new Set<string>()
  if (words.length < size) {
    if (words.length > 0) result.add(words.join(' '))
    return result
  }
  for (let index = 0; index <= words.length - size; index++) {
    result.add(words.slice(index, index + size).join(' '))
  }
  return result
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const item of small) {
    if (large.has(item)) intersection++
  }
  return intersection / (a.size + b.size - intersection)
}

/**
 * Word-level similarity ratio 2*M/T, with M the longest common subsequence.
 * Always >= difflib.SequenceMatcher's word-level ratio, so it is the stricter check.
 */
export function sequenceRatio(a: string[], b: string[]): number {
  const total = a.length + b.length
  if (total === 0) return 0
  const ids = new Map<string, number>()
  const toIds = (words: string[]) =>
    Int32Array.from(words, word => {
      let id = ids.get(word)
      if (id === undefined) {
        id = ids.size
        ids.set(word, id)
      }
      return id
    })
  const left = toIds(a)
  const right = toIds(b)
  let previous = new Int32Array(right.length + 1)
  let current = new Int32Array(right.length + 1)
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      current[j] =
        left[i - 1] === right[j - 1]
          ? (previous[j - 1] ?? 0) + 1
          : Math.max(previous[j] ?? 0, current[j - 1] ?? 0)
    }
    ;[previous, current] = [current, previous]
    current.fill(0)
  }
  return (2 * (previous[right.length] ?? 0)) / total
}

export function similarity(a: string, b: string, names: string[] = []): Score {
  const left = normalizeWords(a, names)
  const right = normalizeWords(b, names)
  return {
    jaccard: round(jaccard(shingles(left), shingles(right))),
    ratio: round(sequenceRatio(left, right))
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** Normalized sentences (list items count as sentences) with at least `minWords` words. */
export function sentences(
  text: string,
  names: string[] = [],
  minWords = MIN_SHARED_SENTENCE_WORDS
): Set<string> {
  const result = new Set<string>()
  for (const line of text.split(/\n+/)) {
    for (const sentence of line.replace(/^\s*(?:[-*]|#+|\d+\.)\s*/, '').split(/(?<=[.!?])\s+/)) {
      const words = normalizeWords(sentence, names)
      if (words.length >= minWords) result.add(words.join(' '))
    }
  }
  return result
}

function faqText(faq: FaqEntry[]): string {
  return faq.map(entry => `${entry.question}\n${entry.answer}`).join('\n\n')
}

/** The "Is this legal?" family of questions (the site appends its standard answer). */
export function isLegalFaq(entry: { question?: string }): boolean {
  return /^\s*(?:is|are)\b[^?]*\blegal\b/i.test(entry.question ?? '')
}

function headingsOf(body: string): string[] {
  return [...body.matchAll(/^##\s+(.+)$/gm)].map(match => (match[1] ?? '').trim().toLowerCase())
}

// ---------------------------------------------------------------------------
// Category / link / media mapping

export function mapCategories(sourceCategories: string[] = []): {
  categories: string[]
  unmapped: string[]
} {
  const categories: string[] = []
  const unmapped: string[] = []
  for (const category of sourceCategories) {
    if (!(category in CATEGORY_MAP)) {
      unmapped.push(category)
      continue
    }
    const mapped = CATEGORY_MAP[category]
    if (mapped && !categories.includes(mapped)) categories.push(mapped)
  }
  return { categories, unmapped }
}

export function absoluteMediaUrl(path?: string): string | undefined {
  const cleaned = cleanString(path)
  if (!cleaned) return undefined
  if (/^https:\/\//.test(cleaned)) return cleaned
  if (cleaned.startsWith('/')) return `${APPS_ORIGIN}${cleaned}`
  return undefined
}

export function buildImages(source: SourceProduct): string[] {
  const images = [
    source.featured_image,
    ...(source.screenshots?.map(screenshot => screenshot.url) ?? []),
    source.featured_image_gif
  ]
    .map(absoluteMediaUrl)
    .filter((url): url is string => Boolean(url) && !url?.includes('serpdownloaders'))
  return [...new Set(images)]
}

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export function buildRelatedLinks(
  source: SourceProduct,
  options: { serpAiSlugs: Set<string>; site: string }
): RelatedLink[] {
  const slug = source.slug ?? ''
  const links: RelatedLink[] = []
  const seenUrls = new Set<string>()
  const seenLabels = new Set<string>()

  function add(label: string | undefined, url: string | undefined): void {
    const cleanLabel = cleanString(label)
    const cleanUrl = cleanString(url)
    if (!cleanLabel || !cleanUrl || !/^https:\/\//.test(cleanUrl)) return
    const key = withoutTrailingSlash(cleanUrl)
    if (seenUrls.has(key) || seenLabels.has(cleanLabel)) return
    if (/help\.serp\.co|apps\.serp\.co\/products\/|libhunt|serp\.co\/products\//i.test(cleanUrl)) {
      return
    }
    links.push({ label: cleanLabel, url: cleanUrl })
    seenUrls.add(key)
    seenLabels.add(cleanLabel)
  }

  if (source.serply_link?.startsWith('https://serp.ly/')) {
    add('Install browser extension', source.serply_link)
  }
  add('SERP Apps', `${APPS_ORIGIN}/${slug}`)

  const github = cleanString(source.github_repo_url ?? undefined)
  const productGithub =
    github && isProductSpecificGithub(github) ? withoutTrailingSlash(github) : ''
  if (productGithub) add('GitHub repository', productGithub)

  for (const link of source.resource_links ?? []) {
    const label = cleanString(link.label ?? link.title)
    if (label && ALLOWED_RESOURCE_LINK_LABELS.has(label)) {
      add(label, link.url ?? link.href)
    }
  }

  if (options.serpAiSlugs.has(slug)) {
    add('SERP AI', `https://serp.ai/products/${slug}/reviews/`)
  }
  add('Browser Extensions', `https://${options.site}/products/${slug}/`)
  if (productGithub) add('Latest Release', `${productGithub}/releases/latest`)

  return links
}

// ---------------------------------------------------------------------------
// Source text

/** Markdown body built from source fields, like upgrade-downloader-content.ts (no reviews). */
export function buildSourceBody(source: SourceProduct): string {
  const sections: string[] = []
  addSection(sections, 'Overview', markdownParagraphs(source.description))
  addSection(sections, 'Why It Exists', markdownList(source.benefits))
  addSection(sections, 'Key Features', markdownList(source.features))

  const howItWorks = source.how_it_works
    ?.map(step => {
      const title = cleanString(step.title)
      const description = cleanString(step.description)
      return title && description ? `- ${title}: ${description}` : undefined
    })
    .filter(Boolean)
    .join('\n')
  addSection(sections, 'How It Works', howItWorks)

  const { browsers, operatingSystems } = supportedSystems(source)
  const compatSections = (source.compatibility_sections ?? []).filter(
    section => section.items?.length
  )
  const hasSection = (pattern: RegExp) =>
    compatSections.some(section => pattern.test(section.title ?? ''))
  const compatibility = [
    browsers.length && !hasSection(/browser/i)
      ? `### Browsers\n\n${markdownList(browsers)}`
      : undefined,
    operatingSystems.length && !hasSection(/operating system/i)
      ? `### Operating Systems\n\n${markdownList(operatingSystems)}`
      : undefined,
    ...compatSections.map(section => {
      const title = cleanString(section.title)
      const items = markdownList(section.items)
      return title && items ? `### ${title}\n\n${items}` : undefined
    })
  ]
    .filter(Boolean)
    .join('\n\n')
  addSection(sections, 'Platform Support', compatibility)

  const privacy = [
    source.supported_regions?.length
      ? `Supported regions: ${source.supported_regions.join(', ')}.`
      : undefined,
    source.limitations?.length ? `Limitations:\n${markdownList(source.limitations)}` : undefined,
    source.permission_justifications?.length
      ? `Permissions:\n${source.permission_justifications
          .map(permission => {
            const name = cleanString(permission.permission)
            const justification = cleanString(permission.justification)
            return name && justification ? `- ${name}: ${justification}` : undefined
          })
          .filter(Boolean)
          .join('\n')}`
      : undefined
  ]
    .filter(Boolean)
    .join('\n\n')
  addSection(sections, 'Privacy and Permissions', privacy)

  return sections.join('\n\n')
}

function supportedSystems(source: SourceProduct): {
  browsers: string[]
  operatingSystems: string[]
} {
  const systems = (source.supported_operating_systems ?? [])
    .map(system => SUPPORTED_SYSTEM_NAMES[system.toLowerCase()] ?? system)
    .filter(Boolean)
  const isOs = (system: string) => ['Windows', 'macOS', 'Linux'].includes(system)
  return {
    browsers: systems.filter(system => !isOs(system)),
    operatingSystems: systems.filter(isOs)
  }
}

/**
 * Places where the source contradicts itself about supported browsers, e.g.
 * `supported_operating_systems` lists more browsers than the "Browsers" compatibility
 * section. Reported for the owner; the rewrite keeps every browser the source names.
 */
export function findSourceConflicts(source: SourceProduct): string[] {
  const conflicts: string[] = []
  const { browsers } = supportedSystems(source)
  if (!browsers.length) return conflicts
  const section = (source.compatibility_sections ?? []).find(
    item => /browser/i.test(item.title ?? '') && item.variant !== 'unsupported'
  )
  if (section) {
    const listed = matchingLabels((section.items ?? []).join('\n'), BROWSER_PATTERNS)
    const missing = browsers.filter(browser => !listed.includes(browser))
    if (missing.length) {
      conflicts.push(
        `supported_operating_systems lists ${browsers.join(', ')}; the "${section.title}" section lists ${listed.join(', ') || 'none'}`
      )
    }
  }
  for (const entry of source.faqs ?? []) {
    const named = matchingLabels(`${entry.answer ?? ''}`, BROWSER_PATTERNS).filter(
      browser => browser !== 'Safari'
    )
    const omitted = browsers.filter(browser => !named.includes(browser))
    if (
      named.length >= 2 &&
      omitted.length &&
      !/such as|including|e\.g\./i.test(entry.answer ?? '')
    ) {
      conflicts.push(
        `FAQ "${entry.question}" names ${named.join(', ')} but supported_operating_systems also lists ${omitted.join(', ')}`
      )
    }
  }
  return conflicts
}

export function buildSourceFaq(source: SourceProduct): FaqEntry[] {
  return (source.faqs ?? [])
    .map(entry => {
      const question = cleanString(entry.question)
      const answer = entry.answer ? stripHtml(entry.answer) : undefined
      return question && answer ? { answer, question } : undefined
    })
    .filter((entry): entry is FaqEntry => Boolean(entry))
    .filter(entry => !isLegalFaq(entry))
}

// ---------------------------------------------------------------------------
// Facts

function matchingLabels(text: string, patterns: Array<[string, RegExp]>): string[] {
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
}

export function extractNumbers(text: string, names: string[] = []): string[] {
  const withoutNames = stripNames(text, names)
    .replace(/^\s*\d+[.)]\s+/gm, ' ')
    .replace(/\b(?:mp3|mp4|m4a|m3u8|h264|h265|x264|x265|4k|8k|r34)\b/gi, ' ')
    .replace(new RegExp(`\\b(${Object.keys(WORD_NUMBERS).join('|')})\\b`, 'gi'), word =>
      String(WORD_NUMBERS[word.toLowerCase()])
    )
  return [...new Set(withoutNames.match(/\b\d+(?:\.\d+)?\b/g) ?? [])].sort()
}

/** Display labels for video quality options, e.g. 1080p, 4K, 60fps. */
export function extractQuality(text: string, names: string[] = []): string[] {
  const stripped = stripNames(text, names)
  const found = new Set<string>()
  for (const match of stripped.matchAll(/\b(\d{3,4})p\b/gi)) found.add(`${match[1]}p`)
  for (const match of stripped.matchAll(/\b([248])K\b/gi)) found.add(`${match[1]}K`)
  for (const match of stripped.matchAll(/\b(\d{2,3})\s?fps\b/gi)) found.add(`${match[1]}fps`)
  return [...found].sort()
}

/**
 * Permission names written as permissions: inline code (`downloads`) anywhere, or names in
 * the label of a list item ("- downloads: ...", "- activeTab and tabs: ..."). Plain prose
 * like "3 free downloads" doesn't count.
 */
export function permissionsIn(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(/`([A-Za-z_]+)`/g)) {
    if (PERMISSION_NAMES.includes(match[1] ?? '')) found.add(match[1] ?? '')
  }
  for (const match of text.matchAll(/^\s*[-*]\s+([^:\n]{1,100}?)\s*(?::|–|—| - )/gm)) {
    const label = (match[1] ?? '').replace(/[*`]/g, '')
    for (const name of PERMISSION_NAMES) {
      const pattern =
        name === 'host_permissions'
          ? /\bhost[_ ]permissions?\b/i
          : new RegExp(`(?<![A-Za-z])${escapeRegExp(name)}(?![A-Za-z])`)
      if (pattern.test(label)) found.add(name)
    }
  }
  return PERMISSION_NAMES.filter(name => found.has(name))
}

export function extractFacts(text: string, platform: string, names: string[] = []): Facts {
  return {
    browsers: matchingLabels(text, BROWSER_PATTERNS),
    folder: /\bfolders?\b/i.test(text),
    formats: matchingLabels(text, FORMAT_PATTERNS),
    limitationTerms: matchingLabels(text, LIMITATION_PATTERNS),
    numbers: extractNumbers(text, names),
    operatingSystems: matchingLabels(text, OS_PATTERNS),
    permissions: permissionsIn(text),
    platform,
    quality: extractQuality(text, names),
    regions: [...new Set(text.match(/\bWorldwide\b/g) ?? [])],
    savePaths: [...new Set(text.match(/\bDownloads\/[A-Za-z0-9 ._-]+?(?=[\s.,;)]|$)/g) ?? [])]
  }
}

/** Facts in the rewrite must match the source: nothing dropped, nothing invented. */
export function checkFacts(facts: Facts, rewriteText: string, names: string[] = []): string[] {
  const issues: string[] = []
  const pricing = pricingLanguage(rewriteText)
  if (pricing.length) issues.push(`pricing/trial language not allowed: ${pricing.join(', ')}`)
  const rewrite = extractFacts(rewriteText, facts.platform, names)

  if (!namePattern(facts.platform, 'i').test(rewriteText)) {
    issues.push(`platform name "${facts.platform}" missing`)
  }

  const compare = (label: string, source: string[], target: string[]) => {
    const missing = source.filter(item => !target.includes(item))
    const added = target.filter(item => !source.includes(item))
    if (missing.length) issues.push(`${label} missing: ${missing.join(', ')}`)
    if (added.length) issues.push(`${label} not in source: ${added.join(', ')}`)
  }

  compare('browsers', facts.browsers, rewrite.browsers)
  compare('operating systems', facts.operatingSystems, rewrite.operatingSystems)
  compare('formats', facts.formats, rewrite.formats)
  compare('permissions', facts.permissions, rewrite.permissions)
  compare('quality options', facts.quality ?? [], rewrite.quality)

  const addedNumbers = rewrite.numbers.filter(number => !facts.numbers.includes(number))
  if (addedNumbers.length) issues.push(`numbers not in source: ${addedNumbers.join(', ')}`)
  const droppedDigits = facts.numbers.filter(
    number => !rewrite.numbers.includes(number) && number !== '1'
  )
  if (droppedDigits.length) issues.push(`numbers missing: ${droppedDigits.join(', ')}`)

  const missingLimitations = facts.limitationTerms.filter(
    term => !rewrite.limitationTerms.includes(term)
  )
  if (missingLimitations.length) {
    issues.push(`limitations missing: ${missingLimitations.join(', ')}`)
  }
  const missingRegions = facts.regions.filter(region => !rewriteText.includes(region))
  if (missingRegions.length) issues.push(`regions missing: ${missingRegions.join(', ')}`)
  if (facts.folder && !rewrite.folder) issues.push('save folder missing')
  const missingPaths = facts.savePaths.filter(path => !rewriteText.includes(path))
  if (missingPaths.length) issues.push(`save path missing: ${missingPaths.join(', ')}`)

  return issues
}

// ---------------------------------------------------------------------------
// Diff against the site

export type Resolution = {
  /** Listing that stays: an existing site key, or the source slug / file that wins. */
  canonical: string
  /** For an existing canonical listing: the skipped product's install link and name. */
  installLink?: { label: string; url: string }
  rule: string
  slug: string
}

export type DiffResult = {
  ambiguous: Array<{ reason: string; slug: string }>
  /** Live products the owner chose to skip (source overrides with `skip`). */
  ownerSkipped: Array<{ reason: string; slug: string }>
  /** Duplicates resolved to one canonical listing (owner rules on #156). */
  resolved: Resolution[]
  duplicateUnderOtherSlug: Array<{ matchedBy: string; siteSlug: string; slug: string }>
  liveCount: number
  missing: SourceProductFile[]
  present: string[]
  slugOnlyMissing: string[]
  sourceDuplicates: Array<{ chosen?: string; files: string[]; identical: boolean; slug: string }>
}

/**
 * Owner-reviewed corrections to source products, kept in
 * scripts/listing-rewrite-source-overrides.json with a reason for each: replace fields such
 * as a generic `serply_link`, or skip a product outright.
 */
export type SourceOverride = {
  reason: string
  set?: Partial<Pick<SourceProduct, 'github_repo_url' | 'serply_link'>>
  skip?: boolean
}

/** Apply source overrides; returns the corrected files and the owner-skipped slugs. */
export function applySourceOverrides(
  files: SourceProductFile[],
  overrides: Record<string, SourceOverride> = {}
): { files: SourceProductFile[]; skipped: Array<{ reason: string; slug: string }> } {
  const skipped: Array<{ reason: string; slug: string }> = []
  const seen = new Set<string>()
  const kept = files.flatMap(file => {
    const slug = file.product.slug ?? ''
    const override = overrides[slug]
    if (!override) return [file]
    if (override.skip) {
      if (!seen.has(slug) && file.product.status === 'live') {
        skipped.push({ reason: override.reason, slug })
      }
      seen.add(slug)
      return []
    }
    return [{ ...file, product: { ...file.product, ...(override.set ?? {}) } }]
  })
  return { files: kept, skipped }
}

/** Commit times (newest first) of a source file, used to pick between duplicate files. */
export type FileHistory = (file: string) => number[] | undefined

/** Last path segment of a serp.ly link or serpapps GitHub URL. */
export function urlSlug(url?: string | null): string | undefined {
  const match = cleanString(url ?? undefined)?.match(
    /^https:\/\/(?:serp\.ly|github\.com\/serpapps)\/([^/?#]+)\/?$/i
  )
  return match?.[1]?.toLowerCase()
}

/** Newest-first commit times compared element by element; positive when `a` is newer. */
function compareHistories(a: number[], b: number[]): number {
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const left = a[index] ?? -1
    const right = b[index] ?? -1
    if (left !== right) return left - right
  }
  return 0
}

function normalizeUrl(url?: string | null): string | undefined {
  const cleaned = cleanString(url ?? undefined)
  return cleaned ? withoutTrailingSlash(cleaned).toLowerCase() : undefined
}

/** https://github.com/serpapps/<repo> for any URL inside that repo. */
export function githubRepoRoot(url?: string): string | undefined {
  const match = url?.match(/^https:\/\/github\.com\/serpapps\/([^/?#]+)/i)
  return match ? `https://github.com/serpapps/${match[1]}` : undefined
}

/** Product "core" name: slug without -downloader / -video suffixes and separators. */
export function slugCore(slug: string): string {
  return slug
    .replace(/-downloader$/, '')
    .replace(/-video$/, '')
    .replace(/[^a-z0-9]/g, '')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item
  )
}

export function diffSourceAgainstSite(
  files: SourceProductFile[],
  siteProducts: SiteProducts,
  options: { fileHistory?: FileHistory } = {}
): DiffResult {
  const siteSlugs = new Set<string>()
  const siteByUrl = new Map<string, string>()
  const siteByCore = new Map<string, string>()
  for (const [key, entry] of Object.entries(siteProducts)) {
    const slug = entry.product?.slug ?? key
    siteSlugs.add(key)
    siteSlugs.add(slug)
    siteByCore.set(slugCore(key), key)
    const links = entry.relatedLinks ?? []
    for (const url of [
      entry.product?.productPage,
      ...links
        .filter(link => ['Install browser extension', 'SERP Apps'].includes(link.label))
        .map(link => link.url),
      // Any serpapps GitHub URL (repo, Latest Release, Issues) identifies the repo.
      ...links.map(link => githubRepoRoot(link.url))
    ]) {
      const normalized = normalizeUrl(url)
      if (normalized) siteByUrl.set(normalized, key)
    }
  }

  const live = files.filter(file => file.product.status === 'live' && file.product.slug)
  const bySlug = new Map<string, SourceProductFile[]>()
  for (const file of live) {
    const slug = file.product.slug as string
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), file])
  }

  const result: DiffResult = {
    ambiguous: [],
    duplicateUnderOtherSlug: [],
    liveCount: bySlug.size,
    missing: [],
    ownerSkipped: [],
    present: [],
    resolved: [],
    slugOnlyMissing: [],
    sourceDuplicates: []
  }

  const candidates: SourceProductFile[] = []
  for (const [slug, group] of [...bySlug.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!siteSlugs.has(slug)) result.slugOnlyMissing.push(slug)
    if (group.length > 1) {
      const identical = group.every(
        file => canonicalJson(file.product) === canonicalJson(group[0]?.product)
      )
      const names = group.map(file => file.file)
      if (identical) {
        const chosen = group.find(file => file.file.endsWith('.json')) ?? group[0]
        result.sourceDuplicates.push({ chosen: chosen?.file, files: names, identical, slug })
        if (chosen) candidates.push(chosen)
        continue
      }
      // Different content: the file with the newer commit in store-new wins.
      const histories = group.map(file => ({ file, history: options.fileHistory?.(file.file) }))
      const ranked = histories
        .filter((item): item is { file: SourceProductFile; history: number[] } =>
          Boolean(item.history?.length)
        )
        .sort((a, b) => compareHistories(b.history, a.history))
      const [first, second] = ranked
      if (
        ranked.length === group.length &&
        first &&
        second &&
        compareHistories(first.history, second.history) > 0
      ) {
        result.sourceDuplicates.push({ chosen: first.file.file, files: names, identical, slug })
        result.resolved.push({
          canonical: first.file.file,
          rule: `same slug in ${names.join(' and ')}; ${first.file.file} has the newer store-new commit history`,
          slug
        })
        candidates.push(first.file)
      } else {
        result.sourceDuplicates.push({ files: names, identical, slug })
        result.ambiguous.push({
          reason: `multiple source files with different content (${names.join(', ')}) and no newer commit to choose by${options.fileHistory ? '' : ' (pass --source-git)'}`,
          slug
        })
      }
      continue
    }
    if (group[0]) candidates.push(group[0])
  }

  // Source products that share an install link or GitHub repo with another live product.
  const sourceUrlOwners = new Map<string, string[]>()
  for (const file of candidates) {
    for (const url of [file.product.serply_link, file.product.github_repo_url]) {
      const normalized = normalizeUrl(url)
      if (normalized) {
        sourceUrlOwners.set(normalized, [
          ...(sourceUrlOwners.get(normalized) ?? []),
          file.product.slug as string
        ])
      }
    }
  }

  for (const file of candidates) {
    const slug = file.product.slug as string
    if (siteSlugs.has(slug)) {
      result.present.push(slug)
      continue
    }

    const urls: Array<[string, string | undefined]> = [
      ['serply_link', normalizeUrl(file.product.serply_link)],
      ['github_repo_url', normalizeUrl(file.product.github_repo_url)],
      ['apps.serp.co url', normalizeUrl(`${APPS_ORIGIN}/${slug}`)]
    ]
    const urlMatch = urls.find(([, url]) => url && siteByUrl.has(url))
    if (urlMatch?.[1]) {
      result.duplicateUnderOtherSlug.push({
        matchedBy: urlMatch[0],
        siteSlug: siteByUrl.get(urlMatch[1]) as string,
        slug
      })
      continue
    }

    const shared = urls
      .map(([label, url]) => ({ label, owners: url ? sourceUrlOwners.get(url) : undefined, url }))
      .find(item => item.owners && item.owners.length > 1)
    if (shared?.owners) {
      // Pick the product whose slug matches the shared serp.ly / GitHub slug.
      const sharedSlug = urlSlug(shared.url)
      const winner = shared.owners.find(owner => owner === sharedSlug)
      if (!winner) {
        result.ambiguous.push({
          reason: `shares ${shared.url} with ${shared.owners.join(', ')}, and no slug matches "${sharedSlug ?? shared.url}"`,
          slug
        })
        continue
      }
      if (winner !== slug) {
        result.resolved.push({
          canonical: winner,
          rule: `shares ${shared.url} with ${winner}, whose slug matches it`,
          slug
        })
        continue
      }
    }

    const coreMatch = siteByCore.get(slugCore(slug))
    if (coreMatch) {
      const existing = siteProducts[coreMatch]
      const existingUrls = new Set(
        [existing?.product?.productPage, ...(existing?.relatedLinks ?? []).map(link => link.url)]
          .map(url => normalizeUrl(url))
          .filter(Boolean)
      )
      const install = cleanString(file.product.serply_link)
      result.resolved.push({
        canonical: coreMatch,
        ...(install?.startsWith('https://serp.ly/') && !existingUrls.has(normalizeUrl(install))
          ? {
              installLink: {
                label: cleanString(file.product.name) ?? slug,
                url: install
              }
            }
          : {}),
        rule: `existing listing ${coreMatch} is canonical`,
        slug
      })
      continue
    }

    result.missing.push(file)
  }

  return result
}

// ---------------------------------------------------------------------------
// Prepare

export type FactOverride = { ignoreNumbers?: string[]; reason: string }

export function buildInput(
  file: SourceProductFile,
  options: {
    factOverrides?: Record<string, FactOverride>
    serpAiSlugs: Set<string>
    site: string
  }
): { input?: RewriteInput; skipReason?: string; unmapped: string[] } {
  const source = file.product
  const slug = source.slug as string
  const { categories, unmapped } = mapCategories(source.categories)
  if (categories.length === 0) {
    return { skipReason: 'no mappable category', unmapped }
  }
  // Owner decision on #156: every new listing is a video downloader and featured, including
  // products whose only source category is Adult.
  if (!categories.includes('video-downloaders')) categories.push('video-downloaders')
  const productPage = cleanString(source.serply_link)
  if (!productPage?.startsWith('https://serp.ly/')) {
    return { skipReason: 'missing serply_link', unmapped }
  }

  const platform = cleanString(source.platform) ?? cleanString(source.name) ?? slug
  const names = namesForSource(source)
  const body = buildSourceBody(source)
  const faq = buildSourceFaq(source)
  const tagline = cleanString(source.tagline) ?? ''
  const factText = withoutPricing(
    [tagline, body, faqText(faq.filter(entry => !isPricingFaq(entry)))].join('\n\n')
  )
  const conflicts = findSourceConflicts(source)

  return {
    input: {
      ...(conflicts.length ? { conflicts } : {}),
      entry: {
        categories,
        featured: true,
        images: buildImages(source),
        productPage,
        relatedLinks: buildRelatedLinks(source, options),
        title: cleanString(source.name) ?? slug
      },
      facts: applyFactOverride(
        extractFacts(factText, platform, names),
        options.factOverrides?.[slug]
      ),
      mode: 'new',
      names,
      site: options.site,
      slug,
      source: { body, faq, tagline },
      sourceFile: file.file
    },
    unmapped
  }
}

/**
 * Reviewed exceptions for source errors that would otherwise force a wrong fact into the
 * rewrite (e.g. another product's name left in by copy-paste). Kept in
 * scripts/listing-rewrite-fact-overrides.json with a reason for each.
 */
function applyFactOverride(facts: Facts, override?: FactOverride): Facts {
  if (!override?.ignoreNumbers?.length) return facts
  return { ...facts, numbers: facts.numbers.filter(n => !override.ignoreNumbers?.includes(n)) }
}

/** Input for rewriting an existing site listing in place (#157). */
export function buildExistingInput(
  slug: string,
  entry: SiteProduct,
  site: string
): RewriteInput | undefined {
  const body = entry.content?.body
  if (!body || !entry.product?.title || !entry.product.productPage) return undefined
  const names = namesForSource({ title: entry.product.title })
  const platform = names.at(-1) ?? entry.product.title
  const faq = (entry.content?.faq ?? []).filter(item => !isLegalFaq(item))
  const tagline = entry.product.tagline ?? ''
  return {
    entry: {
      categories: entry.product.categories ?? [],
      featured: entry.featured === true,
      images: entry.media?.images ?? [],
      productPage: entry.product.productPage,
      relatedLinks: entry.relatedLinks ?? [],
      title: entry.product.title
    },
    facts: extractFacts(
      withoutPricing(
        [tagline, withoutReviews(body), faqText(faq.filter(entry => !isPricingFaq(entry)))]
          .map(withoutInternalNotes)
          .join('\n\n')
      ),
      platform,
      names
    ),
    mode: 'existing',
    names,
    site,
    slug,
    source: { body, faq, tagline }
  }
}

export type UrlStatus = 'ok' | 'dead' | 'unknown'

/**
 * HEAD-check URLs. 2xx/3xx is `ok`, 404/410 is `dead`. Anything else (429, 5xx, network
 * errors) is retried with backoff and ends as `unknown`, which callers treat as not ok.
 */
export async function checkUrls(
  urls: string[],
  options: { concurrency?: number; delayMs?: number; fetcher?: typeof fetch; retries?: number } = {}
): Promise<Map<string, UrlStatus>> {
  const { concurrency = 4, delayMs = 2000, fetcher = fetch, retries = 3 } = options
  const statuses = new Map<string, UrlStatus>()
  const queue = [...new Set(urls)]
  const sleep = (ms: number) => new Promise(done => setTimeout(done, ms))

  async function probe(url: string): Promise<UrlStatus> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(delayMs * attempt)
      try {
        let response = await fetcher(url, { method: 'HEAD', redirect: 'follow' })
        if (response.status === 405) {
          response = await fetcher(url, { method: 'GET', redirect: 'follow' })
        }
        if (response.status >= 200 && response.status < 400) return 'ok'
        if (response.status === 404 || response.status === 410) return 'dead'
      } catch {
        // retry
      }
    }
    return 'unknown'
  }

  async function worker(): Promise<void> {
    for (let url = queue.shift(); url; url = queue.shift()) {
      statuses.set(url, await probe(url))
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return statuses
}

const GITHUB_LINK_LABELS = new Set(['GitHub repository', 'Latest Release'])
const REQUIRED_LINK_LABELS = new Set(['Install browser extension', 'SERP Apps'])

export type LinkAddition = {
  label: string
  /** Existing listing the link is added to. */
  listing: string
  /** Skipped duplicate slug the link comes from. */
  from: string
  status: UrlStatus | 'not checked'
  url: string
}

/** Add a canonical listing's extra install link after its own install link (idempotent). */
export function addRelatedLink(entry: SiteProduct, link: RelatedLink): SiteProduct {
  const links = entry.relatedLinks ?? []
  const normalized = withoutTrailingSlash(link.url).toLowerCase()
  if (links.some(item => withoutTrailingSlash(item.url).toLowerCase() === normalized)) return entry
  let label = link.label
  for (let n = 2; links.some(item => item.label === label); n++) label = `${link.label} (${n})`
  const index = links.findIndex(item => item.label === 'Install browser extension')
  const next = [...links]
  next.splice(index === -1 ? 0 : index + 1, 0, { label, url: link.url })
  return { ...entry, relatedLinks: next }
}

/** URLs prepare verifies for one input (the site's own product page isn't live yet). */
export function urlsToVerify(input: RewriteInput): string[] {
  return [
    ...input.entry.images,
    ...input.entry.relatedLinks
      .filter(link => GITHUB_LINK_LABELS.has(link.label) || REQUIRED_LINK_LABELS.has(link.label))
      .map(link => link.url)
  ]
}

/**
 * Apply verification results: drop images and GitHub links that aren't `ok`. Returns a
 * skip reason when the install link or SERP Apps page isn't reachable.
 */
export function applyLinkCheck(
  input: RewriteInput,
  statuses: Map<string, UrlStatus>,
  checkedAt: string
): { input: RewriteInput; skipReason?: string } {
  const status = (url: string) => statuses.get(url) ?? 'unknown'
  const badRequired = input.entry.relatedLinks.filter(
    link => REQUIRED_LINK_LABELS.has(link.label) && status(link.url) !== 'ok'
  )
  if (badRequired.length) {
    return {
      input,
      skipReason: `unreachable ${badRequired.map(link => `${link.label} (${status(link.url)})`).join(', ')}`
    }
  }
  const githubRepo = input.entry.relatedLinks.find(link => link.label === 'GitHub repository')
  const githubOk = githubRepo ? status(githubRepo.url) === 'ok' : false
  const droppedLinks = input.entry.relatedLinks
    .filter(link => GITHUB_LINK_LABELS.has(link.label) && (!githubOk || status(link.url) !== 'ok'))
    .map(link => `${link.label}: ${link.url} (${status(link.url)})`)
  const droppedImages = input.entry.images.filter(url => status(url) !== 'ok')
  return {
    input: {
      ...input,
      entry: {
        ...input.entry,
        images: input.entry.images.filter(url => status(url) === 'ok'),
        relatedLinks: input.entry.relatedLinks.filter(
          link => !GITHUB_LINK_LABELS.has(link.label) || (githubOk && status(link.url) === 'ok')
        )
      },
      linkCheck: { checkedAt, droppedImages, droppedLinks }
    }
  }
}

// ---------------------------------------------------------------------------
// Check

export function validateOutputShape(value: unknown, slug: string): string[] {
  const issues: string[] = []
  const output = value as Partial<RewriteOutput> | undefined
  if (!output || typeof output !== 'object') return ['output is not an object']
  if (output.slug !== slug) issues.push(`slug mismatch: ${String(output.slug)}`)
  if (typeof output.tagline !== 'string' || !output.tagline.trim()) {
    issues.push('tagline missing')
  } else if (/https?:\/\//i.test(output.tagline)) {
    issues.push('tagline must not contain URLs')
  }
  if (typeof output.body !== 'string' || !output.body.trim()) {
    issues.push('body missing')
  } else {
    const headings = output.body.match(/^## \S/gm) ?? []
    if (headings.length < 3) {
      issues.push(`body needs at least 3 "## " sections (has ${headings.length})`)
    }
    if (/^# \S/m.test(output.body)) issues.push('body must not contain an h1')
    if (/https?:\/\//i.test(output.body)) issues.push('body must not contain URLs')
  }
  if (!Array.isArray(output.faq) || output.faq.length < 3) {
    issues.push('faq needs at least 3 entries (legal FAQ is added by apply)')
  } else {
    output.faq.forEach((entry, index) => {
      if (typeof entry?.question !== 'string' || !entry.question.trim().endsWith('?')) {
        issues.push(`faq[${index}] question must be a string ending in "?"`)
      }
      if (typeof entry?.answer !== 'string' || !entry.answer.trim()) {
        issues.push(`faq[${index}] answer missing`)
      }
      if (entry && isLegalFaq(entry)) issues.push(`faq[${index}] is a legal FAQ; apply adds it`)
      if (/https?:\/\//i.test(entry?.answer ?? '')) issues.push(`faq[${index}] contains a URL`)
    })
  }
  return issues
}

/** Internal build/QA status from the source pipeline. Not product facts; never public copy (#161). */
export const PIPELINE_NOTE_PATTERNS: Array<[string, RegExp]> = [
  [
    'handoff',
    /\bhand-?off (?:is|still|verification|information|rated|needs|has)\b|\b(?:target|solid) hand-?off\b/i
  ],
  ['seed candidate', /\bseed candidates?\b/i],
  [
    'candidate status',
    /\bcandidate[- ](?:stage|status|build|release|extension|tool)\b|\b(?:still|currently|remains) (?:an? |in )?candidate\b/i
  ],
  ['stubs', /\b(?:generated|placeholder|direct-video) (?:direct-video )?stubs?\b|\bstubs?\b/i],
  ['adapter probing', /\badapter probing\b|\bprobe-rejected\b/i],
  ['confidence rating', /\bconfidence (?:rating|level)\b|\bready-solid\b/i],
  ['extraction QA', /\bextraction (?:QA|review)\b/i],
  ['stale config', /\bstale config(?:uration)?\b/i],
  ['release readiness', /\brelease[- ]read(?:y|iness)\b|\breadiness messaging\b/i]
]

export function pipelineNotes(text: string): string[] {
  return PIPELINE_NOTE_PATTERNS.flatMap(([label, pattern]) => {
    const match = text.match(pattern)
    return match ? [`${label} ("${match[0]}")`] : []
  })
}

/** Old shared-template section titles the existing-listing rewrites must not recreate (#161). */
const TEMPLATE_HEADING =
  /troubleshoot|\bnotes?\b|^about\b|supported formats|step[- ]by[- ]step|who it'?s for|use cases|installation instructions|trial/i

/**
 * Copy rules for rewriting existing listings: no pipeline notes, no recreated template
 * sections, no "<Name> is a ..." opening, "activation" instead of licence wording, and a
 * tagline that fits a meta description.
 */
export function existingListingCopyIssues(output: RewriteOutput, names: string[]): string[] {
  const issues: string[] = []
  const all = [output.tagline, output.body, faqText(output.faq)].join('\n')
  const notes = pipelineNotes(all)
  if (notes.length) issues.push(`internal pipeline notes not allowed: ${notes.join(', ')}`)
  const templateHeadings = (output.body.match(/^##+ .+$/gm) ?? [])
    .map(line => line.replace(/^#+\s*/, ''))
    .filter(heading => TEMPLATE_HEADING.test(heading))
  if (templateHeadings.length) {
    issues.push(`old template section headings: ${templateHeadings.join(' | ')}`)
  }
  const firstSentence = output.body
    .replace(/^##+ .+$/gm, '')
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
  const opensWithDefinition = [...names, 'This extension', 'The extension'].some(name =>
    new RegExp(
      `^(?:the )?${escapeRegExp(name)}(?: video)?(?: downloader)?(?: extension)? is an? `,
      'i'
    ).test(firstSentence ?? '')
  )
  if (opensWithDefinition) issues.push('body opens with a "<Name> is a ..." definition')
  if (/\blicen[cs](?:e|es|ing)\b/i.test(all)) issues.push('use "activation", not licence wording')
  const scriptFiles = (all.match(/\b[a-z][\w-]*\.(?:js|mjs|ts)\b/g) ?? []).filter(
    name => !/^(?:video|next|node|react|vue|hls|dash)\.js$/i.test(name)
  )
  if (new RegExp(CODE_REFERENCE.source).test(all) || scriptFiles.length) {
    issues.push(
      `source code references not allowed${scriptFiles.length ? `: ${scriptFiles.join(', ')}` : ''}`
    )
  }
  const taglineLength = output.tagline.trim().length
  if (taglineLength < 70 || taglineLength > 160) {
    issues.push(`tagline must be 70-160 characters (has ${taglineLength})`)
  }
  return issues
}

export type ComparisonListing = {
  body: string
  faq?: FaqEntry[]
  names: string[]
  slug: string
  tagline?: string
}

type PreparedListing = {
  bodyWords: string[]
  headings: string
  questions: string[][]
  sentenceSet: Set<string>
  structure: Set<string>
  shingles3: Set<string>
  slug: string
}

const preparedCache = new WeakMap<ComparisonListing, PreparedListing>()

function prepareListing(listing: ComparisonListing): PreparedListing {
  const cached = preparedCache.get(listing)
  if (cached) return cached
  const bodyWords = normalizeWords(listing.body, listing.names)
  const faq = listing.faq ?? []
  const prepared: PreparedListing = {
    bodyWords,
    headings: headingsOf(listing.body).join('|'),
    questions: faq
      .filter(entry => !isLegalFaq(entry))
      .map(entry => normalizeWords(entry.question, listing.names)),
    sentenceSet: sentences(
      [listing.tagline ?? '', listing.body, faqText(faq.filter(entry => !isLegalFaq(entry)))].join(
        '\n\n'
      ),
      listing.names
    ),
    shingles3: shingles(bodyWords, 3),
    slug: listing.slug,
    structure: structureOf(listing.body, listing.names)
  }
  preparedCache.set(listing, prepared)
  return prepared
}

/** Section headings and bold lead-in labels (e.g. step names), name-normalized. */
function structureOf(body: string, names: string[]): Set<string> {
  const labels = [
    ...body.matchAll(/^##+\s+(.+)$/gm),
    ...body.matchAll(/^\s*(?:[-*]|\d+\.)\s+\*\*(.+?)\*\*/gm)
  ]
  return new Set(
    labels
      .map(match => normalizeWords(match[1] ?? '', names).join(' '))
      .filter(label => label.length > 0)
  )
}

/** Share of `own` structure labels that also appear in `other` (0 when `own` is empty). */
export function structureOverlap(own: Set<string>, other: Set<string>): number {
  if (own.size === 0) return 0
  let shared = 0
  for (const label of own) if (other.has(label)) shared++
  return shared / own.size
}

function questionKey(entry: FaqEntry, names: string[]): string {
  return normalizeWords(entry.question, names).join(' ')
}

export function checkRewrite(
  input: RewriteInput,
  output: RewriteOutput,
  context: {
    otherListings: ComparisonListing[]
    /** Body of the same product on other sites, keyed by site id. */
    otherSites: Record<string, string>
    threshold: number
  }
): CheckResult {
  const issues = validateOutputShape(output, input.slug)
  const names = input.names
  const empty: Score = { jaccard: 0, ratio: 0 }
  if (issues.length > 0) {
    return {
      issues,
      pass: false,
      scores: { bodyVsSource: empty, faqVsSource: empty, taglineVsSource: empty },
      slug: input.slug,
      threshold: context.threshold
    }
  }

  const { threshold } = context
  const over = (score: Score) => score.ratio > threshold || score.jaccard > threshold
  const scores: CheckResult['scores'] = {
    bodyVsSource: similarity(output.body, input.source.body, names),
    faqVsSource: similarity(faqText(output.faq), faqText(input.source.faq), names),
    taglineVsSource: similarity(output.tagline, input.source.tagline, names)
  }
  if (over(scores.bodyVsSource)) issues.push('body too similar to source')
  if (over(scores.faqVsSource)) issues.push('faq too similar to source')
  if (scores.taglineVsSource.ratio > threshold) issues.push('tagline too similar to source')

  const rewriteText = [output.tagline, output.body, faqText(output.faq)].join('\n\n')
  const sourceText = [input.source.tagline, input.source.body, faqText(input.source.faq)].join(
    '\n\n'
  )
  const ownSentences = sentences(rewriteText, names)

  for (const [site, body] of Object.entries(context.otherSites)) {
    const score = similarity(output.body, body, names)
    scores.bodyVsOtherSites = { ...(scores.bodyVsOtherSites ?? {}), [site]: score }
    if (over(score)) issues.push(`body too similar to the ${site} listing`)
    const otherSentences = sentences(body, names)
    const shared = [...ownSentences].filter(sentence => otherSentences.has(sentence))
    if (shared.length) {
      issues.push(`sentences shared with the ${site} listing: ${shared.slice(0, 3).join(' | ')}`)
    }
  }

  // Other listings: rank by 3-word shingles, then the exact LCS ratio for the closest ones.
  const own = prepareListing({
    body: output.body,
    faq: output.faq,
    names,
    slug: input.slug,
    tagline: output.tagline
  })
  const others = context.otherListings
    .filter(listing => listing.slug !== input.slug)
    .map(prepareListing)
  const ranked = others
    .map(other => ({ other, rank: jaccard(own.shingles3, other.shingles3) }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, OTHER_LISTING_RATIO_CANDIDATES)
  for (const { other } of ranked) {
    const score = {
      jaccard: round(jaccard(shingles(own.bodyWords), shingles(other.bodyWords))),
      ratio: round(sequenceRatio(own.bodyWords, other.bodyWords)),
      slug: other.slug
    }
    const current = scores.bodyVsOtherListings
    if (
      !current ||
      Math.max(score.jaccard, score.ratio) > Math.max(current.jaccard, current.ratio)
    ) {
      scores.bodyVsOtherListings = score
    }
  }
  if (scores.bodyVsOtherListings && over(scores.bodyVsOtherListings)) {
    issues.push(`body too similar to ${scores.bodyVsOtherListings.slug}`)
  }

  // Template checks against every other listing: shared sentences (tagline, body, FAQ),
  // reused FAQ questions, and an identical section-heading sequence.
  const closeQuestions = new Map<string, string[]>()
  for (const other of others) {
    const shared = [...own.sentenceSet].filter(sentence => other.sentenceSet.has(sentence))
    if (shared.length) {
      issues.push(`sentences shared with ${other.slug}: ${shared.slice(0, 3).join(' | ')}`)
    }
    for (const question of own.questions) {
      const close = other.questions.find(
        candidate => sequenceRatio(question, candidate) >= QUESTION_SIMILARITY_LIMIT
      )
      if (close) {
        const key = `"${question.join(' ')}" ~ "${close.join(' ')}"`
        closeQuestions.set(key, [...(closeQuestions.get(key) ?? []), other.slug])
      }
    }
    if (own.headings && own.headings === other.headings) {
      issues.push(`same section headings as ${other.slug}`)
    } else if (structureOverlap(own.structure, other.structure) >= STRUCTURE_OVERLAP_LIMIT) {
      const sharedLabels = [...own.structure].filter(label => other.structure.has(label))
      issues.push(`reuses headings/step labels of ${other.slug}: ${sharedLabels.join(' | ')}`)
    }
  }
  for (const [pair, slugs] of closeQuestions) {
    const listed = slugs.slice(0, 3).join(', ')
    const more = slugs.length > 3 ? ` and ${slugs.length - 3} more` : ''
    issues.push(`faq question too close to ${listed}${more}: ${pair}`)
  }

  // Nothing copied from the source: sentences of 6+ words, and FAQ questions.
  const sourceSentences = sentences(sourceText, names, MIN_SOURCE_COPY_WORDS)
  const copied = [...sentences(rewriteText, names, MIN_SOURCE_COPY_WORDS)].filter(sentence =>
    sourceSentences.has(sentence)
  )
  if (copied.length) issues.push(`sentences copied from source: ${copied.slice(0, 3).join(' | ')}`)
  const sourceQuestions = new Set(input.source.faq.map(entry => questionKey(entry, names)))
  const reusedQuestions = output.faq.filter(entry => sourceQuestions.has(questionKey(entry, names)))
  if (reusedQuestions.length) {
    issues.push(
      `faq questions copied from source: ${reusedQuestions.map(q => q.question).join(' | ')}`
    )
  }

  const requiredFaq = input.source.faq.filter(entry => !isPricingFaq(entry)).length
  if (output.faq.length < requiredFaq) {
    issues.push(
      `faq dropped entries (${output.faq.length} vs ${requiredFaq} non-pricing in source); rewrite every one`
    )
  }
  const sourceWords = normalizeWords(input.source.body, names).length
  if (own.bodyWords.length < sourceWords * 0.6) {
    issues.push(
      `body is much shorter than source (${own.bodyWords.length} vs ${sourceWords} words)`
    )
  }

  issues.push(...checkFacts(input.facts, rewriteText, names))
  if (input.mode === 'existing') issues.push(...existingListingCopyIssues(output, names))

  return { issues, pass: issues.length === 0, scores, slug: input.slug, threshold }
}

// ---------------------------------------------------------------------------
// Apply

export function standardLegalAnswer(products: SiteProducts): string | undefined {
  const counts = new Map<string, number>()
  for (const entry of Object.values(products)) {
    for (const faq of entry.content?.faq ?? []) {
      if (faq.question === LEGAL_QUESTION) {
        counts.set(faq.answer, (counts.get(faq.answer) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function buildEntry(
  input: RewriteInput,
  output: RewriteOutput,
  legalAnswer: string,
  existing?: SiteProduct
): SiteProduct {
  const rewritten = output.faq.map(entry => ({
    answer: entry.answer.trim(),
    question: entry.question.trim()
  }))
  if (input.mode === 'existing' && existing) {
    // Keep whatever legal FAQ the listing already has; don't add one it never had.
    const legal = (existing.content?.faq ?? []).filter(isLegalFaq)
    return {
      ...existing,
      content: { ...existing.content, body: output.body.trim(), faq: [...rewritten, ...legal] },
      product: { ...existing.product, tagline: output.tagline.trim() }
    }
  }
  return {
    content: {
      body: output.body.trim(),
      faq: [...rewritten, { answer: legalAnswer, question: LEGAL_QUESTION }]
    },
    featured: input.entry.featured,
    ...(input.entry.images.length ? { media: { images: input.entry.images } } : {}),
    product: {
      categories: input.entry.categories,
      productPage: input.entry.productPage,
      slug: input.slug,
      tagline: output.tagline.trim(),
      title: input.entry.title
    },
    relatedLinks: input.entry.relatedLinks
  }
}

// ---------------------------------------------------------------------------
// CLI

type CliOptions = {
  command: string
  existing: boolean
  exclude: Set<string>
  limit?: number
  replace: boolean
  site: string
  slugs?: string[]
  sourceDir?: string
  sourceGit?: string
  sourceRev?: string
  threshold: number
  verifyLinks: boolean
  workDir: string
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function splitList(value?: string): string[] {
  return (value ?? '')
    .split(/[\s,]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function readExcludeFile(path: string): string[] {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .map(line => line.replace(/#.*/, '').trim())
    .filter(Boolean)
}

export function parseArgs(args: string[], repoRoot: string): CliOptions {
  const excludeFile = resolve(repoRoot, readOption(args, '--exclude-file') ?? DEFAULT_EXCLUDE_FILE)
  const slugs = splitList(readOption(args, '--slugs'))
  const limitValue = readOption(args, '--limit')
  const limit = limitValue === undefined ? undefined : Number(limitValue)
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error(`--limit must be a positive integer (got ${limitValue})`)
  }
  const threshold = Number(readOption(args, '--threshold') ?? DEFAULT_THRESHOLD)
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > DEFAULT_THRESHOLD) {
    throw new Error(`--threshold must be > 0 and <= ${DEFAULT_THRESHOLD}`)
  }
  return {
    command: args[0] ?? '',
    existing: args.includes('--existing'),
    exclude: new Set([
      ...readExcludeFile(excludeFile),
      ...splitList(readOption(args, '--exclude'))
    ]),
    limit,
    replace: args.includes('--replace'),
    site: readOption(args, '--site') ?? DEFAULT_SITE,
    slugs: slugs.length ? slugs : undefined,
    sourceDir: readOption(args, '--source-dir'),
    sourceGit: readOption(args, '--source-git'),
    sourceRev: readOption(args, '--source-rev'),
    threshold,
    verifyLinks: !args.includes('--no-verify-links'),
    workDir: resolve(repoRoot, readOption(args, '--work-dir') ?? DEFAULT_WORK_DIR)
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function sha256(...parts: string[]): string {
  const hash = createHash('sha256')
  for (const part of parts) hash.update(part).update('\0')
  return hash.digest('hex')
}

function readSiteProducts(repoRoot: string, site: string): SiteProducts {
  const path = resolve(repoRoot, 'sites', site, 'products.json')
  return existsSync(path) ? readJson<SiteProducts>(path) : {}
}

function listSites(repoRoot: string): string[] {
  const dir = resolve(repoRoot, 'sites')
  return existsSync(dir)
    ? readdirSync(dir).filter(site => existsSync(join(dir, site, 'products.json')))
    : []
}

function listJsonSlugs(dir: string): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace(/\.json$/, ''))
        .sort()
    : []
}

function loadSourceFiles(options: CliOptions): { dir: string; files: SourceProductFile[] } {
  const dir = resolveStoreNewProductsDir(options.sourceDir)
  return { dir, files: readSourceProductFiles(dir) }
}

/** Commit times (newest first) of a products file in a store-new git checkout. */
function gitFileHistory(gitDir: string, rev: string): FileHistory {
  return file => {
    try {
      const out = execFileSync(
        'git',
        ['-C', gitDir, 'log', '--format=%ct', rev, '--', `${STORE_NEW_PRODUCTS_SUBDIR}/${file}`],
        { encoding: 'utf8' }
      )
      const times = out.split('\n').filter(Boolean).map(Number)
      return times.length ? times : undefined
    } catch {
      return undefined
    }
  }
}

function runDiff(options: CliOptions, repoRoot: string) {
  const { dir, files } = loadSourceFiles(options)
  const siteProducts = readSiteProducts(repoRoot, options.site)
  // `--replace --slugs a,b` re-prepares listings this pipeline already applied.
  if (options.replace && options.slugs) {
    for (const slug of options.slugs) delete siteProducts[slug]
  }
  const fileHistory = options.sourceGit
    ? gitFileHistory(resolve(options.sourceGit), options.sourceRev ?? 'HEAD')
    : undefined
  const overridesPath = resolve(repoRoot, SOURCE_OVERRIDES_FILE)
  const corrected = applySourceOverrides(
    files,
    existsSync(overridesPath) ? readJson<Record<string, SourceOverride>>(overridesPath) : {}
  )
  const diff = diffSourceAgainstSite(corrected.files, siteProducts, { fileHistory })
  diff.ownerSkipped = corrected.skipped
  diff.liveCount += corrected.skipped.length
  return { diff, dir, siteProducts }
}

function summarizeDiff(diff: DiffResult) {
  return {
    ambiguous: diff.ambiguous,
    duplicateUnderOtherSlug: diff.duplicateUnderOtherSlug,
    liveCount: diff.liveCount,
    missingCount: diff.missing.length,
    missingSlugs: diff.missing.map(file => file.product.slug),
    presentCount: diff.present.length,
    ownerSkipped: diff.ownerSkipped,
    resolved: diff.resolved,
    slugOnlyMissingCount: diff.slugOnlyMissing.length,
    sourceDuplicates: diff.sourceDuplicates
  }
}

/** Media files that are missing from a store-new checkout's public/ dir. */
function missingLocalMedia(productsDir: string, images: string[]): string[] {
  const suffix = `/${STORE_NEW_PRODUCTS_SUBDIR}`
  if (!productsDir.endsWith(suffix)) return []
  const publicDir = join(productsDir.slice(0, -suffix.length), 'apps/serp-apps/public')
  if (!existsSync(publicDir)) return []
  return images
    .filter(url => url.startsWith(`${APPS_ORIGIN}/`))
    .filter(url => !existsSync(join(publicDir, url.slice(APPS_ORIGIN.length))))
}

function paths(workDir: string, slug: string) {
  return {
    check: join(workDir, 'check', `${slug}.json`),
    input: join(workDir, 'input', `${slug}.json`),
    output: join(workDir, 'output', `${slug}.json`)
  }
}

function fileHash(workDir: string, slug: string): string | undefined {
  const { input, output } = paths(workDir, slug)
  if (!existsSync(input) || !existsSync(output)) return undefined
  return sha256(readFileSync(input, 'utf8'), readFileSync(output, 'utf8'))
}

/** A slug is done when its stored check passed at the default threshold on the current files. */
export function hasPassingOutput(workDir: string, slug: string): boolean {
  const { check } = paths(workDir, slug)
  if (!existsSync(check)) return false
  const result = readJson<CheckResult>(check)
  return (
    result.pass &&
    result.threshold === DEFAULT_THRESHOLD &&
    result.hash !== undefined &&
    result.hash === fileHash(workDir, slug)
  )
}

function readManifest(workDir: string): Record<string, string> {
  const path = join(workDir, 'manifest.json')
  return existsSync(path) ? readJson<Record<string, string>>(path) : {}
}

async function prepare(options: CliOptions, repoRoot: string): Promise<void> {
  const siteProducts = readSiteProducts(repoRoot, options.site)
  const serpAiSlugs = new Set(Object.keys(readSiteProducts(repoRoot, 'serp.ai')))
  let inputs: RewriteInput[] = []
  const skipped: Array<{ reason: string; slug: string }> = []
  let report: Record<string, unknown> = {}
  let linkAdditions: LinkAddition[] = []

  if (options.existing) {
    for (const slug of options.slugs ?? Object.keys(siteProducts)) {
      const entry = siteProducts[slug]
      const input = entry ? buildExistingInput(slug, entry, options.site) : undefined
      if (input) inputs.push(input)
      else skipped.push({ reason: 'not an existing listing with body/title/productPage', slug })
    }
  } else {
    const { diff, dir } = runDiff(options, repoRoot)
    const overridesPath = resolve(repoRoot, FACT_OVERRIDES_FILE)
    const factOverrides = existsSync(overridesPath)
      ? readJson<Record<string, FactOverride>>(overridesPath)
      : {}
    for (const ambiguous of diff.ambiguous) {
      skipped.push({ reason: `ambiguous: ${ambiguous.reason}`, slug: ambiguous.slug })
    }
    const unmappedCounts: Record<string, number> = {}
    const missingMedia: Record<string, string[]> = {}
    for (const file of diff.missing) {
      const slug = file.product.slug as string
      if (options.exclude.has(slug)) {
        skipped.push({ reason: 'excluded (needs owner decision)', slug })
        continue
      }
      if (NOT_EXTENSIONS.has(slug)) {
        skipped.push({ reason: 'not a browser extension (owner decision)', slug })
        continue
      }
      const { input, skipReason, unmapped } = buildInput(file, {
        factOverrides,
        serpAiSlugs,
        site: options.site
      })
      for (const category of unmapped) {
        unmappedCounts[category] = (unmappedCounts[category] ?? 0) + 1
      }
      if (!input) {
        skipped.push({ reason: skipReason ?? 'unknown', slug })
        continue
      }
      const missing = missingLocalMedia(dir, input.entry.images)
      if (missing.length) missingMedia[slug] = missing
      inputs.push(input)
    }
    const missingSlugs = new Set(diff.missing.map(file => file.product.slug))
    for (const owner of diff.ownerSkipped) {
      skipped.push({ reason: owner.reason, slug: owner.slug })
    }
    for (const resolution of diff.resolved) {
      // A same-slug file pick keeps the slug as a candidate; only other slugs are skipped.
      if (missingSlugs.has(resolution.slug)) continue
      skipped.push({
        reason: `duplicate of ${resolution.canonical}: ${resolution.rule}`,
        slug: resolution.slug
      })
    }
    linkAdditions = diff.resolved.flatMap(resolution =>
      resolution.installLink
        ? [
            {
              ...resolution.installLink,
              from: resolution.slug,
              listing: resolution.canonical,
              status: 'not checked' as const
            }
          ]
        : []
    )
    report = {
      ...summarizeDiff(diff),
      missingMedia,
      sourceDir: dir,
      sourceRev: options.sourceRev ?? 'not recorded (pass --source-rev)',
      unmappedCategories: unmappedCounts
    }
  }

  if (options.slugs) inputs = inputs.filter(input => options.slugs?.includes(input.slug))
  if (options.limit) inputs = inputs.slice(0, options.limit)

  if (options.verifyLinks && !options.existing) {
    const statuses = await checkUrls([
      ...inputs.flatMap(urlsToVerify),
      ...linkAdditions.map(link => link.url)
    ])
    linkAdditions = linkAdditions.map(link => ({
      ...link,
      status: statuses.get(link.url) ?? 'unknown'
    }))
    const checkedAt = new Date().toISOString()
    const verified: RewriteInput[] = []
    for (const input of inputs) {
      const result = applyLinkCheck(input, statuses, checkedAt)
      if (result.skipReason) skipped.push({ reason: result.skipReason, slug: input.slug })
      else verified.push(result.input)
    }
    inputs = verified
    const byStatus = (wanted: UrlStatus) =>
      [...statuses.entries()]
        .filter(([url, status]) => status === wanted && url.startsWith('https://github.com/'))
        .map(([url]) => url)
        .filter(url => !url.endsWith('/releases/latest'))
        .sort()
    report.githubRepos = {
      checked: [...statuses.keys()].filter(
        url => url.startsWith('https://github.com/') && !url.endsWith('/releases/latest')
      ).length,
      dead: byStatus('dead'),
      unknown: byStatus('unknown')
    }
    report.deadImages = [...statuses.entries()]
      .filter(([url, status]) => status !== 'ok' && url.startsWith(`${APPS_ORIGIN}/media/`))
      .map(([url, status]) => `${url} (${status})`)
  } else if (!options.existing) {
    report.githubRepos = 'not checked (--no-verify-links)'
  }

  const manifest = readManifest(options.workDir)
  const pending: string[] = []
  for (const input of inputs) {
    // Resumable: a slug whose output already passed keeps its input untouched.
    if (hasPassingOutput(options.workDir, input.slug)) continue
    const path = paths(options.workDir, input.slug).input
    writeJson(path, input)
    manifest[input.slug] = sha256(readFileSync(path, 'utf8'))
    pending.push(input.slug)
  }
  writeJson(join(options.workDir, 'manifest.json'), manifest)
  if (!options.existing) writeJson(join(options.workDir, 'link-additions.json'), linkAdditions)
  writeFileSync(
    join(options.workDir, 'pending.txt'),
    pending.length ? `${pending.join('\n')}\n` : ''
  )
  writeJson(join(options.workDir, 'diff.json'), {
    ...report,
    candidates: inputs.map(input => input.slug),
    conflicts: Object.fromEntries(
      inputs.filter(input => input.conflicts?.length).map(input => [input.slug, input.conflicts])
    ),
    skipped
  })

  console.log(
    JSON.stringify(
      {
        inputsWritten: inputs.length,
        pending: pending.length,
        skipped: skipped.length,
        workDir: options.workDir
      },
      null,
      2
    )
  )
}

function comparisonListings(
  options: CliOptions,
  siteProducts: SiteProducts,
  outputSlugs: string[]
): ComparisonListing[] {
  const bySlug = new Map<string, ComparisonListing>(
    Object.entries(siteProducts)
      .filter(([, entry]) => entry.content?.body)
      .map(([slug, entry]) => [
        slug,
        {
          body: entry.content?.body ?? '',
          faq: entry.content?.faq,
          names: namesForSource({ title: entry.product?.title }),
          slug,
          tagline: entry.product?.tagline
        }
      ])
  )
  for (const slug of outputSlugs) {
    const { input: inputPath, output: outputPath } = paths(options.workDir, slug)
    if (!existsSync(inputPath)) continue
    try {
      const input = readJson<RewriteInput>(inputPath)
      const output = readJson<RewriteOutput>(outputPath)
      if (typeof output.body === 'string') {
        bySlug.set(slug, {
          body: output.body,
          faq: Array.isArray(output.faq) ? output.faq : [],
          names: input.names,
          slug,
          tagline: output.tagline
        })
      }
    } catch {
      // invalid output JSON is reported when that slug is checked
    }
  }
  return [...bySlug.values()]
}

/** The same product on every other site, matched by slug or install link. */
function otherSiteBodies(
  repoRoot: string,
  site: string
): (slug: string, productPage: string) => Record<string, string> {
  const sites = listSites(repoRoot)
    .filter(id => id !== site)
    .map(id => {
      const products = readSiteProducts(repoRoot, id)
      const byPage = new Map<string, string>()
      for (const [key, entry] of Object.entries(products)) {
        const page = entry.product?.productPage?.replace(/\/+$/, '')
        if (page && entry.content?.body) byPage.set(page, entry.content.body)
        if (entry.content?.body) byPage.set(`slug:${key}`, entry.content.body)
      }
      return { byPage, id }
    })
  return (slug, productPage) => {
    const result: Record<string, string> = {}
    for (const { byPage, id } of sites) {
      const body = byPage.get(`slug:${slug}`) ?? byPage.get(productPage.replace(/\/+$/, ''))
      if (body) result[id] = body
    }
    return result
  }
}

function failed(slug: string, issue: string): CheckResult {
  const empty = { jaccard: 0, ratio: 0 }
  return {
    issues: [issue],
    pass: false,
    scores: { bodyVsSource: empty, faqVsSource: empty, taglineVsSource: empty },
    slug
  }
}

export function runCheck(options: CliOptions, repoRoot: string): CheckResult[] {
  const siteProducts = readSiteProducts(repoRoot, options.site)
  const outputSlugs = listJsonSlugs(join(options.workDir, 'output'))
  const others = comparisonListings(options, siteProducts, outputSlugs)
  const otherSites = otherSiteBodies(repoRoot, options.site)
  const manifest = readManifest(options.workDir)
  const results: CheckResult[] = []

  for (const slug of options.slugs ?? outputSlugs) {
    const file = paths(options.workDir, slug)
    let result: CheckResult
    if (!existsSync(file.input) || !existsSync(file.output)) {
      result = failed(slug, `missing ${existsSync(file.input) ? 'output' : 'input'} file`)
    } else if (manifest[slug] !== sha256(readFileSync(file.input, 'utf8'))) {
      result = failed(slug, 'input file changed since prepare (re-run prepare)')
    } else {
      const input = readJson<RewriteInput>(file.input)
      try {
        const output = readJson<RewriteOutput>(file.output)
        result = checkRewrite(input, output, {
          otherListings: others,
          otherSites: otherSites(slug, input.entry.productPage),
          threshold: options.threshold
        })
      } catch (error) {
        result = failed(slug, `output is not valid JSON: ${(error as Error).message}`)
      }
    }
    result.hash = fileHash(options.workDir, slug)
    result.threshold = options.threshold
    writeJson(file.check, result)
    results.push(result)
  }

  const allResults = listJsonSlugs(join(options.workDir, 'check')).map(slug =>
    readJson<CheckResult>(paths(options.workDir, slug).check)
  )
  writeJson(join(options.workDir, 'check-report.json'), { results: allResults })
  return results
}

function printCheck(results: CheckResult[]): void {
  for (const result of results) {
    const s = result.scores
    const other = s.bodyVsOtherListings
      ? ` other=${s.bodyVsOtherListings.ratio}/${s.bodyVsOtherListings.jaccard} (${s.bodyVsOtherListings.slug})`
      : ''
    console.log(
      `${result.pass ? 'PASS' : 'FAIL'} ${result.slug} body=${s.bodyVsSource.ratio}/${s.bodyVsSource.jaccard} faq=${s.faqVsSource.ratio}/${s.faqVsSource.jaccard} tagline=${s.taglineVsSource.ratio}${other}`
    )
    for (const issue of result.issues) console.log(`  - ${issue}`)
  }
  const failedCount = results.filter(result => !result.pass).length
  console.log(
    `${results.length - failedCount} passed, ${failedCount} failed (scores: ratio/jaccard)`
  )
}

function apply(options: CliOptions, repoRoot: string): void {
  const results = runCheck(options, repoRoot)
  printCheck(results)
  const productsPath = resolve(repoRoot, 'sites', options.site, 'products.json')
  const products = readSiteProducts(repoRoot, options.site)
  const legalAnswer = standardLegalAnswer(products)
  if (!legalAnswer) throw new Error(`No "${LEGAL_QUESTION}" FAQ found on ${options.site}`)

  const applied: string[] = []
  const refused: string[] = []
  for (const result of results.filter(item => item.pass)) {
    const file = paths(options.workDir, result.slug)
    const input = readJson<RewriteInput>(file.input)
    const output = readJson<RewriteOutput>(file.output)
    const existing = products[result.slug]
    if (options.exclude.has(result.slug)) {
      refused.push(`${result.slug}: excluded`)
      continue
    }
    if (input.mode === 'new' && !input.linkCheck) {
      refused.push(`${result.slug}: links not verified (re-run prepare without --no-verify-links)`)
      continue
    }
    if (input.mode === 'new' && existing && !options.replace) {
      refused.push(`${result.slug}: already in products.json (pass --replace to overwrite)`)
      continue
    }
    products[result.slug] = buildEntry(input, output, legalAnswer, existing)
    applied.push(result.slug)
  }

  // Install links of skipped duplicates go onto their canonical existing listing, but only
  // when prepare verified them (2xx/3xx).
  const additionsPath = join(options.workDir, 'link-additions.json')
  const additions = existsSync(additionsPath) ? readJson<LinkAddition[]>(additionsPath) : []
  for (const link of additions) {
    const entry = products[link.listing]
    if (!entry) continue
    if (link.status !== 'ok') {
      refused.push(`link ${link.url} for ${link.listing}: ${link.status}`)
      continue
    }
    const updated = addRelatedLink(entry, link)
    if (updated !== entry) {
      products[link.listing] = updated
      applied.push(`${link.listing} (+${link.label})`)
    }
  }

  writeJson(productsPath, products)
  for (const line of refused) console.log(`refused ${line}`)
  console.log(`applied ${applied.length}: ${applied.join(', ')}`)
  if (refused.length || results.some(result => !result.pass)) process.exitCode = 1
}

export async function main(args: string[], repoRoot = process.cwd()): Promise<void> {
  const options = parseArgs(args, repoRoot)
  switch (options.command) {
    case 'diff': {
      const { diff, dir } = runDiff(options, repoRoot)
      writeJson(join(options.workDir, 'diff-summary.json'), {
        ...summarizeDiff(diff),
        sourceDir: dir,
        sourceRev: options.sourceRev ?? 'not recorded (pass --source-rev)'
      })
      console.log(
        JSON.stringify(
          {
            ambiguous: diff.ambiguous.length,
            duplicateUnderOtherSlug: diff.duplicateUnderOtherSlug.length,
            liveCount: diff.liveCount,
            missing: diff.missing.length,
            present: diff.present.length,
            slugOnlyMissing: diff.slugOnlyMissing.length,
            sourceDuplicates: diff.sourceDuplicates.length
          },
          null,
          2
        )
      )
      break
    }
    case 'prepare':
      await prepare(options, repoRoot)
      break
    case 'check': {
      const results = runCheck(options, repoRoot)
      printCheck(results)
      if (results.some(result => !result.pass)) process.exitCode = 1
      break
    }
    case 'apply':
      apply(options, repoRoot)
      break
    default:
      console.error('Usage: listing-rewrite.ts <diff|prepare|check|apply> [options]')
      process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
