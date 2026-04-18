import {
  getActiveCategories,
  getFeaturedListingCount,
  getListingCategories,
  getUnknownCategorySlugs,
  hasFeaturedListings,
  listingMatchesCategory,
} from '@thedaviddias/web-core/category-navigation';

const sampleListings = [
  {
    category: 'developer-tools',
    categories: ['developer-tools', 'video-downloaders'],
    featured: true,
  },
  {
    category: 'integration-automation',
    featured: false,
  },
];

describe('category-navigation', () => {
  it('returns the normalized primary-plus-secondary categories for a listing', () => {
    expect(getListingCategories(sampleListings[0]!)).toEqual([
      'developer-tools',
      'video-downloaders',
    ]);
  });

  it('matches category pages against either the primary or a secondary category', () => {
    expect(listingMatchesCategory(sampleListings[0]!, 'developer-tools')).toBe(
      true
    );
    expect(
      listingMatchesCategory(sampleListings[0]!, 'video-downloaders')
    ).toBe(true);
    expect(
      listingMatchesCategory(sampleListings[0]!, 'infrastructure-cloud')
    ).toBe(false);
  });

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
          categories: ['developer-tools', 'really-made-up-category'],
          featured: false,
        },
      ])
    ).toEqual(['made-up-category', 'really-made-up-category']);
  });

  it('uses the requested site category set when a site id is provided', () => {
    expect(
      getUnknownCategorySlugs(
        [
          { category: 'video-downloaders' },
          { category: 'developer-tools' },
        ],
        'serpdownloaders.com'
      )
    ).toEqual(['developer-tools']);
  });
});
