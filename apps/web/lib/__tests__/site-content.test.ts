import { resolveSiteContent } from '@/lib/site-content';

describe('resolveSiteContent', () => {
  it('loads the checked-in SERP Software site-owned content', () => {
    const content = resolveSiteContent('serp.software');

    expect(content).toEqual({
      externalResources: [],
      listingCliInstall: null,
      networkLinks: [],
    });
  });
});
