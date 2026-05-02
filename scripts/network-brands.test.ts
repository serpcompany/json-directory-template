import { describe, expect, it } from 'vitest'
import { getNetworkBrands, parseNetworkBrands } from '../packages/web-core/src/network-brands.ts'

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
})
