import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type SerpdownloadersProductEntry = {
  content?: {
    body?: string
  }
  product?: {
    productPage?: string
    slug?: string
    tagline?: string
    title?: string
  }
}

const productsPath = resolve(
  process.cwd(),
  'sites/serpdownloaders.com/products.json'
)

const missing404ProductSlugs = [
  'getty-images-downloader',
  'unsplash-downloader',
  'wistia-video-downloader',
  'adobe-stock-downloader',
  'soundgasm-downloader',
  'vectorstock-downloader',
  'coursera-downloader',
  'deviantart-downloader',
  'hulu-downloader',
  'internet-archive-downloader',
  'livejasmin-downloader',
  'moodle-downloader',
  'netflix-downloader',
  'patreon-downloader',
  'pexels-video-downloader',
  'rawpixel-downloader',
  'redtube-video-downloader',
  'terabox-downloader',
  'thumbnail-downloader',
  'xnxx-video-downloader',
  'alamy-downloader',
  'nicovideo-downloader',
  'podia-downloader',
  'skillshare-downloader',
  'skool-video-downloader',
  'snapchat-video-downloader',
  'teachable-video-downloader'
] as const

describe('serpdownloaders checked-in products', () => {
  it('includes the downloader listings currently missing from live 404 traffic', () => {
    const products = JSON.parse(
      readFileSync(productsPath, 'utf8')
    ) as Record<string, SerpdownloadersProductEntry>

    for (const slug of missing404ProductSlugs) {
      expect(products[slug]).toBeDefined()
      expect(products[slug]?.product).toMatchObject({
        productPage: expect.stringMatching(/^https:\/\/serp\.ly\/.+/),
        slug,
        tagline: expect.any(String),
        title: expect.any(String)
      })
      expect(products[slug]?.content?.body).toContain('## Overview')
    }
  })
})
