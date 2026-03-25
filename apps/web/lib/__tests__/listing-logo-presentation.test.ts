import {
  LISTING_LOGO_FALLBACK_PATH,
  shouldUseProvidedListingLogo,
} from '@/lib/listing-logo-presentation';

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

  it('exports the checked-in serp fallback asset path', () => {
    expect(LISTING_LOGO_FALLBACK_PATH).toBe('/img/serp-arrow-logo-black.svg');
  });
});
