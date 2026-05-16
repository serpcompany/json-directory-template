import { describe, expect, it } from 'vitest'
import {
  buildSerpCoProducts,
  sanitizeLegacyMdxText,
  writeSerpCoProducts,
} from './build-serp-co-products.ts'

describe('sanitizeLegacyMdxText', () => {
  it('escapes prose comparison markers that MDX would parse as JSX', () => {
    expect(sanitizeLegacyMdxText('Maintains <1 second latency and >99% accuracy.')).toBe(
      'Maintains &lt;1 second latency and &gt;99% accuracy.'
    )
  })

  it('normalizes escaped fenced code blocks from legacy JSON exports', () => {
    expect(
      sanitizeLegacyMdxText(
        '\\`\\`\\`javascript const response = fetch(url, { method: "POST" }); \\`\\`\\`'
      )
    ).toBe(
      '```javascript const response = fetch(url, &#123; method: "POST" &#125;); ```'
    )
  })

  it('escapes braces in inline legacy code snippets that MDX would parse as expressions', () => {
    expect(sanitizeLegacyMdxText('HTTP.auth("Bearer #{token}") and find { |link| link }')).toBe(
      'HTTP.auth("Bearer #&#123;token&#125;") and find &#123; |link| link &#125;'
    )
  })

  it('removes imported Cloudflare email-protection links that are not real internal pages', () => {
    expect(
      sanitizeLegacyMdxText('Contact [\\[email protected\\]](/cdn-cgi/l/email-protection).')
    ).toBe('Contact \\[email protected\\].')
    expect(sanitizeLegacyMdxText('Visit /cdn-cgi/l/email-protection for support.')).toBe(
      'Visit email support for support.'
    )
  })
})

describe('buildSerpCoProducts', () => {
  it('requires an explicit base product export path before writing checked-in data', () => {
    expect(() =>
      writeSerpCoProducts({
        canonicalDownloaderProductsPath: 'scripts/__missing-canonical-products.json',
        downloaderProductsPath: 'scripts/__missing-downloader-products.json',
        outputPath: 'scripts/__must-not-be-written.json',
      })
    ).toThrow(/baseProductsPath/)
  })

  it('keeps legacy categories when a canonical downloader overwrites an existing product', () => {
    const products = buildSerpCoProducts({
      baseProducts: {
        'example-downloader': {
          product: {
            categories: ['gif-downloaders'],
            productPage: 'https://serp.ly/legacy-example',
            slug: 'example-downloader',
            tagline: 'Legacy example downloader',
            title: 'Legacy Example Downloader',
          },
        },
      },
      downloaderProducts: {
        'example-downloader': {
          product: {
            productPage: 'https://serp.ly/example-downloader',
            slug: 'example-downloader',
            tagline: 'Example downloader',
            title: 'Example Downloader',
          },
        },
      },
    })

    expect(products['example-downloader']?.product.categories).toEqual([
      'video-downloaders',
      'gif-downloaders',
    ])
  })

  it('lets canonical downloader products replace imported apps.serp.co product links', () => {
    const products = buildSerpCoProducts({
      baseProducts: {
        'video-downloader': {
          content: {
            body: '## Useful Links\n\n- [Website](https://apps.serp.co/video-downloader)',
          },
          product: {
            categories: ['social-media-downloaders'],
            productPage: 'https://apps.serp.co/video-downloader',
            slug: 'video-downloader',
            tagline: 'Imported downloader',
            title: 'Imported Downloader',
          },
        },
      },
      canonicalDownloaderProducts: {
        'video-downloader': {
          content: {
            body: '## Useful Links\n\n- [Website](https://serp.ly/video-downloader)',
          },
          product: {
            categories: ['video-downloaders'],
            productPage: 'https://serp.ly/video-downloader',
            slug: 'video-downloader',
            tagline: 'Canonical downloader',
            title: 'Canonical Downloader',
          },
        },
      },
      downloaderProducts: {},
    })

    expect(products['video-downloader']?.product).toMatchObject({
      categories: ['video-downloaders', 'social-media-downloaders'],
      productPage: 'https://serp.ly/video-downloader',
      title: 'Canonical Downloader',
    })
    expect(products['video-downloader']?.content?.body).toContain('https://serp.ly/video-downloader')
    expect(products['video-downloader']?.content?.body).not.toContain('apps.serp.co')
  })
})
