import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'

type SiteProduct = {
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
  product?: {
    categories?: string[]
    productPage?: string
    slug?: string
    tagline?: string
    title?: string
  }
  relatedLinks?: Array<{
    label: string
    url: string
  }>
}

type SourceProduct = {
  benefits?: string[]
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
  supported_operating_systems?: string[]
  supported_regions?: string[]
  tagline?: string
}

type ToolsProduct = {
  content?: {
    productLinks?: {
      appsUrl?: string
      githubRepoUrl?: string
      serplyUrl?: string
    }
    sourceLinks?: Array<{
      label?: string
      title?: string
      url?: string
    }>
  }
  id?: string
  route?: string
}

const repoRoot = process.cwd()
const toolsProductsPath =
  '/Users/devin/dev/repos/tools.serp.co/packages/app-core/src/data/tools.json'
const sourceDirs = [
  '/Users/devin/dev/repos/store-new/apps/store/data/products',
  '/Users/devin/dev/repos/store-new/apps/store/data/adult-products'
]

const sites = [
  'serpdownloaders.com',
  'pornvideodownloaders.com',
  'serp.ai',
  'browserextensions.io',
  'serp.co'
] as const

const sourceBySlug = new Map<string, SourceProduct>()
const toolsBySlug = new Map<string, ToolsProduct>()

function cleanString(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function stripHtml(value: string): string {
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

function markdownList(items?: string[]): string | undefined {
  const cleaned = items?.map(cleanString).filter(Boolean) as string[] | undefined
  return cleaned?.length ? cleaned.map(item => `- ${item}`).join('\n') : undefined
}

function markdownParagraphs(value?: string): string | undefined {
  const cleaned = cleanString(value)
  return cleaned?.replace(/\n{3,}/g, '\n\n')
}

function addSection(sections: string[], title: string, body?: string): void {
  const cleaned = cleanString(body)
  if (cleaned) {
    sections.push(`## ${title}\n\n${cleaned}`)
  }
}

function buildBody(source: SourceProduct, fallback: SiteProduct): string | undefined {
  const sections: string[] = []

  addSection(sections, 'Overview', markdownParagraphs(source.description))

  addSection(
    sections,
    'Why It Exists',
    source.benefits?.length
      ? markdownList(source.benefits)
      : fallback.content?.body?.includes('## Why It Exists')
        ? undefined
        : source.tagline
  )

  addSection(sections, 'Key Features', markdownList(source.features?.slice(0, 10)))

  const howItWorks = source.how_it_works
    ?.map(step => {
      const title = cleanString(step.title)
      const description = cleanString(step.description)
      return title && description ? `- ${title}: ${description}` : undefined
    })
    .filter(Boolean)
    .join('\n')
  addSection(sections, 'How It Works', howItWorks)

  const reviews = source.reviews
    ?.slice(0, 3)
    .map(review => {
      const title = cleanString(review.title)
      const body = cleanString(review.review)
      const name = cleanString(review.name)
      const rating = review.rating ? ` (${review.rating}/5)` : ''
      return title && body ? `- ${title}${rating}: ${body}${name ? ` - ${name}` : ''}` : undefined
    })
    .filter(Boolean)
    .join('\n')
  addSection(sections, 'Reviews', reviews)

  const compatibility = source.compatibility_sections
    ?.filter(section => section.items?.length)
    .map(section => {
      const title = cleanString(section.title)
      const items = markdownList(section.items)
      return title && items ? `### ${title}\n\n${items}` : undefined
    })
    .filter(Boolean)
    .join('\n\n')
  addSection(sections, 'Platform Support', compatibility)

  const privacyNotes = [
    source.supported_regions?.length
      ? `Supported regions: ${source.supported_regions.join(', ')}.`
      : undefined,
    source.limitations?.length
      ? `Limitations:\n${markdownList(source.limitations.slice(0, 8))}`
      : undefined,
    source.permission_justifications?.length
      ? `Permissions:\n${source.permission_justifications
          .slice(0, 6)
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
  addSection(sections, 'Privacy and Permissions', privacyNotes)

  return sections.length > 0 ? sections.join('\n\n') : fallback.content?.body
}

function buildFaq(source: SourceProduct, fallback: SiteProduct): SiteProduct['content']['faq'] {
  const sourceFaq = source.faqs
    ?.map(entry => {
      const question = cleanString(entry.question)
      const answer = entry.answer ? stripHtml(entry.answer) : undefined

      return question && answer ? { answer, question } : undefined
    })
    .filter((entry): entry is { answer: string; question: string } => Boolean(entry))

  return sourceFaq?.length ? sourceFaq : fallback.content?.faq
}

function isProductSpecificGithub(url: string): boolean {
  return /^https:\/\/github\.com\/serpapps\/[^/]+/.test(url) && basename(url).includes('downloader')
}

function slugFromUrl(url?: string): string | undefined {
  const cleaned = cleanString(url)
  if (!cleaned) {
    return undefined
  }

  try {
    const parsed = new URL(cleaned)
    const parts = parsed.pathname.split('/').filter(Boolean)
    return parts.at(-1)
  } catch {
    return undefined
  }
}

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function canonicalRelatedUrl(label: string, url: string): string {
  if (
    ['SERP', 'SERP AI'].includes(label) &&
    /^https:\/\/(?:serp\.co|serp\.ai)\/products\/[^/]+\/reviews\/?$/.test(url)
  ) {
    return `${withoutTrailingSlash(url)}/`
  }

  if (
    label === 'Browser Extensions' &&
    /^https:\/\/browserextensions\.io\/products\/[^/]+\/?$/.test(url)
  ) {
    return `${withoutTrailingSlash(url)}/`
  }

  if (
    label === 'SERP Extensions' &&
    /^https:\/\/extensions\.serp\.co\/extensions\/serp\/[^/]+\/?$/.test(url)
  ) {
    return `${withoutTrailingSlash(url)}/`
  }

  return url
}

function cleanRelatedLabel(label?: string): string | undefined {
  const cleaned = cleanString(label)
  if (!cleaned) {
    return undefined
  }

  if (/^product page$/i.test(cleaned)) {
    return 'SERP Apps'
  }

  if (/^github repository$/i.test(cleaned) || /^github$/i.test(cleaned)) {
    return 'GitHub repository'
  }

  if (/^(install extension|install browser extension)$/i.test(cleaned)) {
    return 'Install browser extension'
  }

  return cleaned
}

function buildRelatedLinks(
  source: SourceProduct | undefined,
  fallback: SiteProduct,
  toolsProduct: ToolsProduct | undefined
): SiteProduct['relatedLinks'] {
  const links: NonNullable<SiteProduct['relatedLinks']> = []
  const seen = new Set<string>()
  const seenLabels = new Set<string>()

  function add(label: string | undefined, url: string | undefined): void {
    const cleanLabel = cleanRelatedLabel(label)
    const cleanUrl = cleanLabel
      ? cleanString(canonicalRelatedUrl(cleanLabel, url ?? ''))
      : undefined

    const seenUrl = cleanUrl ? withoutTrailingSlash(cleanUrl) : undefined

    if (
      !cleanLabel ||
      !cleanUrl ||
      !seenUrl ||
      seen.has(seenUrl) ||
      seenLabels.has(cleanLabel) ||
      /^https?:\/\//.test(cleanLabel)
    ) {
      return
    }

    if (
      seenUrl === 'https://github.com/serpapps' ||
      seenUrl.startsWith('https://apps.serp.co/products/') ||
      /^LibHunt$/i.test(cleanLabel) ||
      (cleanLabel === 'GitHub repository' && !isProductSpecificGithub(cleanUrl)) ||
      (cleanLabel === 'SERP Apps' && /^https:\/\/serp\.ly\//.test(cleanUrl))
    ) {
      return
    }

    links.push({ label: cleanLabel, url: cleanUrl })
    seen.add(seenUrl)
    seenLabels.add(cleanLabel)
  }

  const productLinks = toolsProduct?.content?.productLinks
  const installUrl = productLinks?.serplyUrl ?? source?.serply_link ?? fallback.product?.productPage
  const appsUrl =
    productLinks?.appsUrl ?? (source?.slug ? `https://apps.serp.co/${source.slug}` : undefined)
  const githubUrl = productLinks?.githubRepoUrl ?? source?.github_repo_url

  if (installUrl?.startsWith('https://serp.ly/')) {
    add('Install browser extension', installUrl)
  }

  if (appsUrl?.startsWith('https://apps.serp.co/') && !appsUrl.includes('/products/')) {
    add('SERP Apps', appsUrl)
  }

  if (githubUrl && isProductSpecificGithub(githubUrl)) {
    add('GitHub repository', githubUrl)
  }

  for (const link of toolsProduct?.content?.sourceLinks ?? []) {
    add(link.label ?? link.title, link.url)
  }

  for (const link of source?.resource_links ?? []) {
    add(link.label ?? link.title, link.url ?? link.href)
  }

  for (const link of fallback.relatedLinks ?? []) {
    add(link.label, link.url)
  }

  return links.length > 0 ? links : undefined
}

function buildImages(
  source: SourceProduct | undefined,
  fallback: SiteProduct
): string[] | undefined {
  const images = [
    ...(fallback.media?.images ?? []),
    ...((source?.screenshots?.map(screenshot => screenshot.url).filter(Boolean) as
      | string[]
      | undefined) ?? []),
    source?.featured_image,
    source?.featured_image_gif
  ]
    .map(cleanString)
    .filter(Boolean) as string[]
  const uniqueImages = [...new Set(images)]

  return uniqueImages.length > 0 ? uniqueImages : undefined
}

function loadSourceProducts(): void {
  for (const dir of sourceDirs) {
    if (!existsSync(dir)) {
      continue
    }

    for (const file of readdirJson(dir)) {
      const product = parseJsonc(readFileSync(join(dir, file), 'utf8')) as SourceProduct
      if (!product?.slug) {
        continue
      }

      indexSourceProduct(product.slug, product)
      const serplySlug = product.serply_link?.replace(/^https:\/\/serp\.ly\//, '')
      if (serplySlug) {
        indexSourceProduct(serplySlug, product)
      }
      if (product.github_repo_url && isProductSpecificGithub(product.github_repo_url)) {
        indexSourceProduct(basename(product.github_repo_url), product)
      }
    }
  }
}

function loadToolsProducts(): void {
  if (!existsSync(toolsProductsPath)) {
    return
  }

  const products = JSON.parse(readFileSync(toolsProductsPath, 'utf8')) as ToolsProduct[]
  for (const product of products) {
    if (!product.content?.productLinks && !product.content?.sourceLinks?.length) {
      continue
    }

    const productLinks = product.content.productLinks
    for (const slug of [
      slugFromUrl(productLinks?.serplyUrl),
      slugFromUrl(productLinks?.appsUrl),
      slugFromUrl(productLinks?.githubRepoUrl),
      product.id?.replace(/^download-/, '').replace(/-videos$/, '-downloader'),
      product.route
        ?.replace(/^\//, '')
        .replace(/^download-/, '')
        .replace(/-videos$/, '-downloader')
    ]) {
      if (slug) {
        indexToolsProduct(slug, product)
      }
    }
  }
}

function readdirJson(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith('.json')) : []
}

function indexSourceProduct(slug: string, product: SourceProduct): void {
  sourceBySlug.set(slug, product)
  sourceBySlug.set(slug.replace('-video-downloader', '-downloader'), product)
  sourceBySlug.set(slug.replace('-downloader', '-video-downloader'), product)
}

function indexToolsProduct(slug: string, product: ToolsProduct): void {
  toolsBySlug.set(slug, product)
  toolsBySlug.set(slug.replace('-video-downloader', '-downloader'), product)
  toolsBySlug.set(slug.replace('-downloader', '-video-downloader'), product)
  toolsBySlug.set(slug.replace('-porno-', 'porno-'), product)
  toolsBySlug.set(slug.replace('alpha-porno-', 'alphaporno-'), product)
  toolsBySlug.set(slug.replace('alphaporno-', 'alpha-porno-'), product)
  toolsBySlug.set(slug.replace('twitter-video-downloader', 'twitter-x-downloader'), product)
  toolsBySlug.set(slug.replace('twitter-x-downloader', 'twitter-video-downloader'), product)
}

function findSource(key: string, product: SiteProduct): SourceProduct | undefined {
  const candidates = [
    key,
    product.product?.slug,
    product.product?.productPage?.replace(/^https:\/\/serp\.ly\//, ''),
    key.replace('-video-downloader', '-downloader'),
    key.replace('-downloader', '-video-downloader')
  ].filter(Boolean) as string[]

  return candidates.map(candidate => sourceBySlug.get(candidate)).find(Boolean)
}

function findToolsProduct(
  key: string,
  product: SiteProduct,
  source?: SourceProduct
): ToolsProduct | undefined {
  const candidates = [
    key,
    product.product?.slug,
    source?.slug,
    slugFromUrl(product.product?.productPage),
    slugFromUrl(source?.serply_link),
    slugFromUrl(source?.github_repo_url ?? undefined),
    key.replace('-video-downloader', '-downloader'),
    key.replace('-downloader', '-video-downloader')
  ].filter(Boolean) as string[]

  return candidates.map(candidate => toolsBySlug.get(candidate)).find(Boolean)
}

function upgradeProduct(key: string, product: SiteProduct, site: string): SiteProduct {
  const source = findSource(key, product)
  const toolsProduct = findToolsProduct(key, product, source)
  const upgraded: SiteProduct = {
    ...product,
    product: {
      ...product.product,
      ...(source?.name ? { title: source.name } : {}),
      ...(source?.tagline ? { tagline: source.tagline } : {}),
      ...(source?.serply_link ? { productPage: source.serply_link } : {}),
      slug: product.product?.slug ?? key
    },
    relatedLinks: buildRelatedLinks(source, product, toolsProduct)
  }

  if (source) {
    upgraded.content = {
      body: buildBody(source, product),
      faq: buildFaq(source, product)
    }

    const images =
      site === 'browserextensions.io'
        ? buildImages(source, product)?.filter(image => !image.includes('serpdownloaders'))
        : buildImages(source, product)
    upgraded.media = {
      ...(product.media ?? {}),
      ...(images ? { images } : {})
    }
  }

  return JSON.parse(JSON.stringify(upgraded)) as SiteProduct
}

function isDownloaderProduct(key: string, product: SiteProduct): boolean {
  return (
    key.includes('downloader') ||
    product.product?.slug?.includes('downloader') === true ||
    product.product?.title?.toLowerCase().includes('downloader') === true ||
    product.product?.categories?.includes('video-downloaders') === true
  )
}

function readSiteProducts(site: string): Record<string, SiteProduct> {
  return JSON.parse(
    readFileSync(resolve(repoRoot, 'sites', site, 'products.json'), 'utf8')
  ) as Record<string, SiteProduct>
}

function writeSiteProducts(site: string, products: Record<string, SiteProduct>): void {
  writeFileSync(
    resolve(repoRoot, 'sites', site, 'products.json'),
    `${JSON.stringify(products, null, 2)}\n`
  )
}

loadSourceProducts()
loadToolsProducts()

for (const site of sites) {
  const products = readSiteProducts(site)
  const upgradedProducts = Object.fromEntries(
    Object.entries(products).map(([key, product]) => [
      key,
      site === 'serp.co' && !isDownloaderProduct(key, product)
        ? product
        : upgradeProduct(key, product, site)
    ])
  )

  writeSiteProducts(site, upgradedProducts)
}

writeSiteProducts('serp.software', readSiteProducts('serpdownloaders.com'))
