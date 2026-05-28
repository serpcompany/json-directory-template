import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const productsPath = resolve(process.cwd(), 'sites/pornvideodownloaders.com/products.json')

const expectedAdultProductSlugs = [
  'alphaporno-downloader',
  'ashemaletube-downloader',
  'beeg-downloader',
  'bongacams-downloader',
  'boyfriendtv-downloader',
  'cam4-downloader',
  'camscom-downloader',
  'camsoda-downloader',
  'chaturbate-downloader',
  'coomer-downloader',
  'dreamcam-downloader',
  'dreamcam-vr-downloader',
  'eporner-downloader',
  'erome-downloader',
  'erothots-downloader',
  'fansly-live-downloader',
  'flirt4free-downloader',
  'hdzog-downloader',
  'hentaihaven-downloader',
  'justforfans-downloader',
  'livejasmin-downloader',
  'luxuretv-downloader',
  'manyvids-downloader',
  'motherless-downloader',
  'myfreecams-downloader',
  'nhentai-downloader',
  'onlyfans-bulk-downloader',
  'onlyfans-downloader',
  'pornhub-downloader',
  'porntrex-downloader',
  'redgifs-downloader',
  'redtube-downloader',
  'redtube-video-downloader',
  'sexchathu-downloader',
  'spankbang-downloader',
  'streamate-downloader',
  'stripchat-downloader',
  'stripchat-vr-downloader',
  'thisvid-downloader',
  'tnaflix-downloader',
  'txxx-downloader',
  'upornia-downloader',
  'xfantazy-downloader',
  'xhamster-downloader',
  'xhamsterlive-downloader',
  'xlovecam-downloader',
  'xnxx-downloader',
  'xnxx-video-downloader',
  'xvideos-downloader',
  'yespornplease-downloader',
  'youjizz-downloader',
  'youporn-downloader'
] as const

const excludedGeneralProductSlugs = [
  'youtube-downloader',
  'tiktok-downloader',
  'dailymotion-downloader',
  'vimeo-downloader',
  'wistia-downloader',
  'udemy-downloader',
  'coursera-downloader',
  'getty-images-downloader',
  'unsplash-downloader'
] as const

describe('pornvideodownloaders checked-in products', () => {
  it('contains the existing adult subset plus the imported adult downloader sheet rows', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      {
        product?: {
          categories?: string[]
          productPage?: string
          slug?: string
          tagline?: string
          title?: string
        }
        content?: {
          body?: string
          faq?: Array<{
            answer?: string
            question?: string
          }>
        }
        media?: {
          logo?: string
        }
        relatedLinks?: Array<{
          label?: string
          url?: string
        }>
      }
    >
    const importedAdultSlugs = Object.entries(products)
      .filter(([, product]) => product.product?.categories?.includes('adult'))
      .map(([slug]) => slug)

    expect(Object.keys(products)).toHaveLength(266)
    expect(importedAdultSlugs).toHaveLength(214)

    for (const slug of [
      ...expectedAdultProductSlugs,
      '321tube-downloader',
      '4k69-downloader',
      'zbporn-downloader'
    ] as const) {
      expect(products[slug]?.product).toMatchObject({
        productPage: expect.stringMatching(/^https:\/\/serp\.ly\/.+/),
        slug,
        tagline: expect.any(String),
        title: expect.any(String)
      })
      if (importedAdultSlugs.includes(slug)) {
        expect(products[slug]?.product?.categories, slug).toEqual(['adult', 'video-downloaders'])
      }
      expect(products[slug]?.content?.body).toContain('## Overview')
      expect(products[slug]?.content?.faq?.length).toBeGreaterThanOrEqual(3)

      const logoPath = products[slug]?.media?.logo
      if (logoPath) {
        expect(logoPath).toMatch(/^\/listing-logos\/pornvideodownloaders\.com\/.+\.png$/)
        expect(
          existsSync(
            resolve(process.cwd(), 'apps/pornvideodownloaders.com/public', logoPath.slice(1))
          )
        ).toBe(true)
      }

      for (const link of products[slug]?.relatedLinks ?? []) {
        expect(link.label, `${slug} link label`).not.toMatch(/^https?:\/\//)
        expect(link.url, `${slug} link url`).not.toBe('https://github.com/serpapps')
        expect(link.url, `${slug} link url`).not.toBe('https://github.com/serpapps/le')
        expect(link.url, `${slug} link url`).not.toContain('apps.serp.co/products/')
        expect(`${link.label} ${link.url}`, `${slug} related link`).not.toMatch(/libhunt/i)
        expect(
          link.label === 'SERP Apps' && link.url?.startsWith('https://serp.ly/'),
          `${slug} serp.ly must not be labeled SERP Apps`
        ).toBe(false)
      }

      const relatedUrls = new Set<string>()
      const relatedLabels = new Set<string>()
      for (const link of products[slug]?.relatedLinks ?? []) {
        const normalizedUrl = link.url?.replace(/\/+$/, '')
        expect(
          relatedUrls.has(normalizedUrl ?? ''),
          `${slug} duplicate related link ${link.url}`
        ).toBe(false)
        if (normalizedUrl) {
          relatedUrls.add(normalizedUrl)
        }
        expect(
          relatedLabels.has(link.label ?? ''),
          `${slug} duplicate related label ${link.label}`
        ).toBe(false)
        if (link.label) {
          relatedLabels.add(link.label)
        }
      }
    }

    for (const slug of excludedGeneralProductSlugs) {
      expect(products[slug]).toBeUndefined()
    }
  })
})
