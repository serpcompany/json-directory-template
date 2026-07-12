import {
  DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH,
  getListingLogoFallbackPath,
  shouldUseProvidedListingLogo
} from '@thedaviddias/web-core/listing-logo-presentation'

describe('listing-logo-presentation', () => {
  it('accepts remote logo urls and supported local raster/vector assets', () => {
    expect(shouldUseProvidedListingLogo('https://imagedelivery.net/example/logo/public')).toBe(true)
    expect(
      shouldUseProvidedListingLogo('/listing-logos/serpdownloaders.com/youtube-downloader.png')
    ).toBe(true)
    expect(
      shouldUseProvidedListingLogo(
        '/listing-logos/serpdownloaders.com/youtube-downloader.png?version=2'
      )
    ).toBe(true)

    expect(
      shouldUseProvidedListingLogo('/listing-logos/serpdownloaders.com/example-logo.svg')
    ).toBe(true)

    expect(
      shouldUseProvidedListingLogo('/listing-logos/serpdownloaders.com/youtube-downloader.ico')
    ).toBe(false)
    expect(shouldUseProvidedListingLogo(undefined)).toBe(false)
  })

  it('uses the neutral fallback on the default starter', () => {
    expect(DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH).toBe(
      '/listing-logos/favicon-fallback-512x512.png'
    )
    expect(getListingLogoFallbackPath()).toBe('/listing-logos/favicon-fallback-512x512.png')
  })
})
