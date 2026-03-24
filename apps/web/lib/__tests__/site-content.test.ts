import { resolveSiteContent } from '@/lib/site-content';

describe('resolveSiteContent', () => {
  it('loads the checked-in SERP Extensions site-owned network links', () => {
    const content = resolveSiteContent('serpextensions');

    expect(content.listingCliInstall).toBeNull();
    expect(content.externalResources).toEqual([]);
    expect(content.networkLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: 'https://tools.serp.co',
          label: 'Tools',
          title: 'SERP Tools',
        }),
        expect.objectContaining({
          href: 'https://apps.serp.co',
          label: 'Apps',
          title: 'SERP Apps',
        }),
      ])
    );
  });
});
