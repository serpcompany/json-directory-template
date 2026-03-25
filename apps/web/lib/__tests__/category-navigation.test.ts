import {
  getActiveCategories,
  getFeaturedListingCount,
  getUnknownCategorySlugs,
  hasFeaturedListings,
} from '@/lib/category-navigation';

const sampleListings = [
  {
    category: 'developer-tools',
    featured: true,
  },
  {
    category: 'integration-automation',
    featured: false,
  },
];

describe('category-navigation', () => {
  it('returns only populated canonical categories in starter taxonomy order', () => {
    expect(
      getActiveCategories(sampleListings).map((category) => category.slug)
    ).toEqual(['developer-tools', 'video-downloaders']);
  });

  it('tracks featured availability from the listing set', () => {
    expect(getFeaturedListingCount(sampleListings)).toBe(1);
    expect(hasFeaturedListings(sampleListings)).toBe(true);
    expect(
      hasFeaturedListings([{ category: 'developer-tools', featured: false }])
    ).toBe(false);
  });

  it('reports unknown normalized category slugs for validation', () => {
    expect(
      getUnknownCategorySlugs([
        ...sampleListings,
        {
          category: 'made-up-category',
          featured: false,
        },
      ])
    ).toEqual(['made-up-category']);
  });
});
