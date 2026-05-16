import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

type TrialProduct = {
  content?: {
    body?: string
    faq?: unknown[]
  }
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
  relatedLinks?: {
    label: string
    url: string
  }[]
}

type TrialProducts = Record<string, TrialProduct>

const DEFAULT_CANONICAL_DOWNLOADERS_PATH = 'sites/browserextensions.io/products.json'
const DEFAULT_DOWNLOADERS_PATH = 'sites/serpdownloaders.com/products.json'
const DEFAULT_OUTPUT_PATH = 'sites/serp.co/products.json'

export function sanitizeLegacyMdxText(value: string): string {
  return value
    .replaceAll(
      '[\\[email protected\\]](/cdn-cgi/l/email-protection)',
      '\\[email protected\\]'
    )
    .replaceAll(
      /(?<!!)\[([^\]\n]{1,120})\]\(\/cdn-cgi\/l\/email-protection\)/g,
      '$1'
    )
    .replaceAll('/cdn-cgi/l/email-protection', 'email support')
    .replaceAll('\\`\\`\\`', '```')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function buildSerpCoProducts({
  baseProducts,
  canonicalDownloaderProducts = {},
  downloaderProducts,
}: {
  baseProducts: TrialProducts
  canonicalDownloaderProducts?: TrialProducts
  downloaderProducts: TrialProducts
}): TrialProducts {
  const products: TrialProducts = {}
  const canonicalProducts = {
    ...canonicalDownloaderProducts,
    ...downloaderProducts,
  }

  for (const [slug, value] of Object.entries(canonicalProducts)) {
    const baseCategories = baseProducts[slug]?.product.categories ?? []
    const canonicalCategories = value.product.categories ?? []
    const categories = [
      ...new Set(['video-downloaders', ...canonicalCategories, ...baseCategories]),
    ]

    products[slug] = sanitizeTrialProduct({
      ...structuredClone(value),
      product: {
        ...value.product,
        categories,
      },
    })
  }

  for (const [slug, value] of Object.entries(baseProducts)) {
    if (products[slug]) {
      continue
    }

    products[slug] = sanitizeTrialProduct(structuredClone(value))
  }

  return products
}

function sanitizeTrialProduct(product: TrialProduct): TrialProduct {
  return {
    ...product,
    content: product.content
      ? {
          ...product.content,
          body: product.content.body
            ? sanitizeLegacyMdxText(product.content.body)
            : product.content.body,
        }
      : product.content,
    product: {
      ...product.product,
      tagline: sanitizeLegacyMdxText(product.product.tagline),
    },
  }
}

function sanitizeTrialProducts(products: TrialProducts): TrialProducts {
  return Object.fromEntries(
    Object.entries(products).map(([slug, product]) => [
      slug,
      sanitizeTrialProduct(structuredClone(product)),
    ])
  )
}

export function writeSerpCoProducts({
  baseProductsPath = process.env.SERP_CO_BASE_PRODUCTS_PATH,
  canonicalDownloaderProductsPath = DEFAULT_CANONICAL_DOWNLOADERS_PATH,
  downloaderProductsPath = DEFAULT_DOWNLOADERS_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
}: {
  baseProductsPath?: string
  canonicalDownloaderProductsPath?: string
  downloaderProductsPath?: string
  outputPath?: string
} = {}): number {
  if (!baseProductsPath) {
    throw new Error(
      'writeSerpCoProducts requires baseProductsPath or SERP_CO_BASE_PRODUCTS_PATH'
    )
  }

  const baseProducts = JSON.parse(readFileSync(baseProductsPath, 'utf8')) as TrialProducts
  const canonicalDownloaderProducts = JSON.parse(
    readFileSync(canonicalDownloaderProductsPath, 'utf8')
  ) as TrialProducts
  const downloaderProducts = JSON.parse(readFileSync(downloaderProductsPath, 'utf8')) as TrialProducts
  const products = buildSerpCoProducts({
    baseProducts,
    canonicalDownloaderProducts,
    downloaderProducts,
  })

  writeFileSync(outputPath, `${JSON.stringify(products, null, 2)}\n`)

  return Object.keys(products).length
}

function readCliOption(name: string): string | undefined {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = readCliOption('--output') ?? DEFAULT_OUTPUT_PATH
  const count = writeSerpCoProducts({
    baseProductsPath: readCliOption('--base-products'),
    canonicalDownloaderProductsPath: readCliOption('--canonical-downloaders'),
    downloaderProductsPath: readCliOption('--downloaders'),
    outputPath,
  })
  console.log(`Wrote ${count} serp.co products to ${outputPath}`)
}
