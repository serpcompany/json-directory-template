import { describe, expect, it } from 'vitest'
import {
  getFeaturedOnBadgePreviewPathFromKey,
  getFeaturedOnBadgePublicUrlFromKey
} from './featured-on-badge-url'

describe('featured-on badge URL helpers', () => {
  it('builds local preview and public paths from relative badge keys', () => {
    expect(getFeaturedOnBadgePreviewPathFromKey('badge/featured-on-example-light.svg')).toBe(
      '/badge/featured-on-example-light.svg'
    )
    expect(getFeaturedOnBadgePublicUrlFromKey('badge/featured-on-example-light.svg')).toBe(
      '/badge/featured-on-example-light.svg'
    )
  })

  it('builds absolute public URLs from local public badge paths', () => {
    expect(
      getFeaturedOnBadgePublicUrlFromKey(
        'badge/browserextensions.io-featured-on-light.svg',
        'https://browserextensions.io/'
      )
    ).toBe('https://browserextensions.io/badge/browserextensions.io-featured-on-light.svg')
  })
})
