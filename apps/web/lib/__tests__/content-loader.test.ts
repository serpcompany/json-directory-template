jest.mock('@/.content-collections/generated', () => ({
  allAboutPages: [],
  allDocs: [],
  allGuides: [],
  allLegals: [],
  allResources: [],
  allWebsites: [
    {
      category: 'developer-tools',
      description: 'Legacy website collection entry.',
      name: 'Legacy Website Entry',
      publishedAt: '2026-01-01',
      slug: 'legacy-website-entry',
      website: 'https://legacy.example.com',
    },
  ],
}));

import { getWebsites } from '@/lib/content-loader';

describe('getWebsites', () => {
  it('prefers checked-in JSON listing data over the legacy website content collection', () => {
    const websites = getWebsites();

    expect(websites.length).toBeGreaterThan(0);
    expect(websites.some((website) => website.slug === 'example-api-toolkit')).toBe(
      true
    );
    expect(
      websites.some((website) => website.slug === 'legacy-website-entry')
    ).toBe(false);
  });
});
