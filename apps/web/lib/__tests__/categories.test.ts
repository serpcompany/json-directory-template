import { categories, normalizeCategorySlug, resolveCategories } from '@/lib/categories';

describe('normalizeCategorySlug', () => {
  it('maps legacy aliases to the active category slug', () => {
    expect(normalizeCategorySlug('integration-automation')).toBe(
      'video-downloaders'
    );
    expect(normalizeCategorySlug('automation-workflow')).toBe(
      'video-downloaders'
    );
  });

  it('keeps known category slugs unchanged', () => {
    expect(normalizeCategorySlug('developer-tools')).toBe('developer-tools');
    expect(normalizeCategorySlug('video-downloaders')).toBe(
      'video-downloaders'
    );
  });
});

describe('categories', () => {
  it('includes the normalized video downloader category', () => {
    expect(
      categories.some((category) => category.slug === 'video-downloaders')
    ).toBe(true);
  });

  it('includes shared categories imported from the larger serp category set', () => {
    expect(
      resolveCategories('serp.co').some(
        (category) => category.slug === 'ai-agents'
      )
    ).toBe(true);
  });

  it('applies fallback metadata when a category only supplies slug and name', () => {
    const category = resolveCategories('serp.co').find(
      (item) => item.slug === 'ai-agents'
    );

    expect(category).toBeDefined();
    expect(category?.icon).toBeDefined();
    expect(category?.priority).toBe('low');
    expect(category?.description).toBe(
      'Browse ai agents listings and resources.'
    );
  });
});
