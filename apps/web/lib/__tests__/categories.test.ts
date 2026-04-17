import { categories, normalizeCategorySlug, resolveCategories } from '@/lib/categories'

describe('normalizeCategorySlug', () => {
  it('maps legacy aliases to the active category slug', () => {
    expect(normalizeCategorySlug('integration-automation')).toBe('video-downloaders')
    expect(normalizeCategorySlug('automation-workflow')).toBe('video-downloaders')
  })

  it('keeps known category slugs unchanged', () => {
    expect(normalizeCategorySlug('developer-tools')).toBe('developer-tools')
    expect(normalizeCategorySlug('video-downloaders')).toBe('video-downloaders')
  })
})

describe('categories', () => {
  it('includes the normalized video downloader category', () => {
    expect(categories.some(category => category.slug === 'video-downloaders')).toBe(true)
  })

  it('applies fallback metadata when a category only supplies slug and name', () => {
    const category = resolveCategories('serpdownloaders.com').find(
      item => item.slug === 'video-downloaders'
    )

    expect(category).toBeDefined()
    expect(category?.icon).toBeDefined()
    expect(category?.priority).toBe('medium')
    expect(category?.description).toBe(
      'Downloaders, recorders, and browser tools for saving online video'
    )
  })

  it('rejects removed site ids when resolving categories', () => {
    for (const siteId of ['serp.co', 'serp.software']) {
      expect(() => resolveCategories(siteId)).toThrow(
        `Site "${siteId}" was removed from this repo. Use a supported checked-in site id instead.`
      )
    }
  })
})
