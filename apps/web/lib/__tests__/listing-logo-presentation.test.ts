import {
  DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH,
  SITE_BRAND_LISTING_LOGO_FALLBACK_PATH,
  getListingLogoFallbackPath,
  shouldUseProvidedListingLogo,
} from '@/lib/listing-logo-presentation';

jest.mock('@/lib/site-config', () => ({
  siteConfig: {
    id: 'default',
  },
}));

describe('listing-logo-presentation', () => {
  it('only treats png logos as preferred provided logos', () => {
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
        '/listing-logos/serpdownloaders.com/youtube-downloader.ico'
      )
    ).toBe(false);
    expect(
      shouldUseProvidedListingLogo(
        '/listing-logos/serpdownloaders.com/youtube-downloader.svg'
      )
    ).toBe(false);
    expect(shouldUseProvidedListingLogo(undefined)).toBe(false);
  });

  it('uses the neutral fallback on the default starter', () => {
    expect(DEFAULT_SITE_LISTING_LOGO_FALLBACK_PATH).toBe('/placeholder.svg');
    expect(getListingLogoFallbackPath()).toBe('/placeholder.svg');
  });

  it('keeps the site-brand fallback available for checked-in example sites', async () => {
    const { siteConfig } = await import('@/lib/site-config');
    siteConfig.id = 'serpdownloaders.com';

    expect(SITE_BRAND_LISTING_LOGO_FALLBACK_PATH).toBe('/logo.png');
    expect(getListingLogoFallbackPath()).toBe('/logo.png');

    siteConfig.id = 'default';
  });
});
