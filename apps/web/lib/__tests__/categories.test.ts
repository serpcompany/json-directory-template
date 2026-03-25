import { categories, normalizeCategorySlug } from '@/lib/categories';

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
});
