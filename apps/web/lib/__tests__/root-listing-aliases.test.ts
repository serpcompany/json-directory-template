import { getSiteRootListingAliases } from '@/lib/site-root-listing-aliases'

describe('site root listing aliases', () => {
  it('returns root-path aliases for all serpdownloaders product slugs', () => {
    const aliases = getSiteRootListingAliases('serpdownloaders.com')

    expect(aliases).toContain('instagram-downloader')
    expect(aliases).toContain('getty-images-downloader')
    expect(aliases).toContain('teachable-video-downloader')
    expect(aliases).not.toContain('about')
  })
})
