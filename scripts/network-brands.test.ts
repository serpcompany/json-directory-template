import { describe, expect, it } from 'vitest'
import {
  getNetworkBrands,
  getNetworkBrandsForGroup,
  parseNetworkBrandGroup,
  parseNetworkBrands
} from '../packages/web-core/src/network-brands.ts'

describe('parseNetworkBrands', () => {
  it('returns sorted brand entries with hostnames', () => {
    expect(
      parseNetworkBrands({
        brands: {
          zed: { name: 'Zed Brand', url: 'https://zed.example/path' },
          alpha: { name: 'Alpha Brand', url: 'https://alpha.example/' }
        }
      })
    ).toEqual([
      {
        hostname: 'alpha.example',
        name: 'Alpha Brand',
        slug: 'alpha',
        url: 'https://alpha.example/'
      },
      {
        hostname: 'zed.example',
        name: 'Zed Brand',
        slug: 'zed',
        url: 'https://zed.example/path'
      }
    ])
  })

  it('rejects duplicate normalized URLs', () => {
    expect(() =>
      parseNetworkBrands({
        brands: {
          first: { name: 'First', url: 'https://example.com/path?utm=1#top' },
          second: { name: 'Second', url: 'https://EXAMPLE.com/path/' }
        }
      })
    ).toThrow(
      'Duplicate network brand URL "https://EXAMPLE.com/path/" for "second" duplicates "first"'
    )
  })

  it('rejects invalid brand URLs', () => {
    expect(() =>
      parseNetworkBrands({
        brands: {
          alpha: { name: 'Alpha', url: 'ftp://alpha.example' }
        }
      })
    ).toThrow('Invalid network brand URL for "alpha": ftp://alpha.example')
  })

  it('rejects missing names', () => {
    expect(() =>
      parseNetworkBrands({
        brands: {
          alpha: { name: ' ', url: 'https://alpha.example' }
        }
      })
    ).toThrow('Network brand "alpha" must include a name')
  })

  it('returns committed network brands data', () => {
    const brands = getNetworkBrands()

    expect(brands.length).toBeGreaterThan(0)
    expect(brands[0]).toEqual(
      expect.objectContaining({
        hostname: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        url: expect.stringMatching(/^https?:\/\//)
      })
    )
  })

  it('returns the committed SERPXXX brand group from the shared source data', () => {
    const brands = getNetworkBrandsForGroup('serpxxxGroup')

    expect(brands.map(brand => brand.slug)).toEqual([
      'serp-xxx',
      'onlyfansvideodownloader-com',
      'justforfans-downloader',
      'pornvideodownloaders-com',
      'porno-downloaders',
      'thisvidvideodownloader-com',
      'xhamstervideodownloader-com',
      'pornhubvideodownloaderapp-com',
      'boyfriendtvdownloader-com',
      'spankbangvideodownloader-com',
      'epornerdownloader-com',
      'tnaflixvideodownloader-com',
      'redgifsdownloaderapp-com',
      'eromevideodownloader-com'
    ])
    expect(brands).toEqual([
      expect.objectContaining({
        name: 'SERP XXX',
        url: 'https://serp.xxx'
      }),
      expect.objectContaining({
        name: 'OnlyFans Video Downloader',
        url: 'https://onlyfansvideodownloader.com'
      }),
      expect.objectContaining({
        name: 'JustForFans Downloader',
        url: 'https://justforfansdownloader.com'
      }),
      expect.objectContaining({
        name: 'Porn Video Downloaders',
        url: 'https://pornvideodownloaders.com'
      }),
      expect.objectContaining({
        name: 'Porno Downloaders',
        url: 'https://pornodownloaders.com'
      }),
      expect.objectContaining({
        name: 'ThisVid Video Downloader',
        url: 'https://thisvidvideodownloader.com'
      }),
      expect.objectContaining({
        name: 'xHamster Video Downloader',
        url: 'https://xhamstervideodownloader.com'
      }),
      expect.objectContaining({
        name: 'Pornhub Video Downloader',
        url: 'https://pornhubvideodownloaderapp.com'
      }),
      expect.objectContaining({
        name: 'BoyfriendTV Downloader',
        url: 'https://boyfriendtvdownloader.com'
      }),
      expect.objectContaining({
        name: 'SpankBang Video Downloader',
        url: 'https://spankbangvideodownloader.com'
      }),
      expect.objectContaining({
        name: 'Eporner Video Downloader',
        url: 'https://epornerdownloader.com'
      }),
      expect.objectContaining({
        name: 'TNAFlix Video Downloader',
        url: 'https://tnaflixvideodownloader.com'
      }),
      expect.objectContaining({
        name: 'RedGIFs Downloader',
        url: 'https://redgifsdownloaderapp.com'
      }),
      expect.objectContaining({
        name: 'Erome Video Downloader',
        url: 'https://eromevideodownloader.com'
      })
    ])
  })

  it('rejects brand groups that reference missing brand entries', () => {
    expect(() =>
      parseNetworkBrandGroup(
        {
          brandGroups: {
            example: ['missing-brand']
          },
          brands: {}
        },
        'example'
      )
    ).toThrow('Network brand group "example" references missing brand "missing-brand"')
  })
})
