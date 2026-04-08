import {
  DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH,
  getListingLogoFallbackPath,
  shouldUseProvidedListingLogo,
} from '@/lib/listing-logo-presentation';

jest.mock('@/lib/site-config', () => ({
  siteConfig: {
    branding: {},
    id: 'default',
  },
}));

describe('listing-logo-presentation', () => {
  it('accepts remote logo urls and supported local raster/vector assets', () => {
    expect(
      shouldUseProvidedListingLogo(
        'https://imagedelivery.net/example/logo/public'
      )
    ).toBe(true);
    expect(
      shouldUseProvidedListingLogo(
        '/listing-logos/serpdownloaders.com/youtube-downloader.png'
      )
    ).toBe(true);
    expect(
      shouldUseProvidedListingLogo(
        '/listing-logos/serpdownloaders.com/youtube-downloader.png?version=2'
      )
    ).toBe(true);

    expect(
      shouldUseProvidedListingLogo(
        '/listing-logos/serpdownloaders.com/example-logo.svg'
      )
    ).toBe(true);

    expect(
      shouldUseProvidedListingLogo(
        '/listing-logos/serpdownloaders.com/youtube-downloader.ico'
      )
    ).toBe(false);
    expect(shouldUseProvidedListingLogo(undefined)).toBe(false);
  });

  it('uses the neutral fallback on the default starter', () => {
    expect(DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH).toBe('/placeholder.svg');
    expect(getListingLogoFallbackPath()).toBe('/placeholder.svg');
  });

  it('uses a configured site-brand fallback when one exists', async () => {
    const { siteConfig } = await import('@/lib/site-config');
    siteConfig.branding.logoUrl = '/logo.png';

    expect(getListingLogoFallbackPath()).toBe('/logo.png');

    siteConfig.branding.logoUrl = undefined;
  });
});
