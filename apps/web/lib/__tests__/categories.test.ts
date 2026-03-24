import { categories, normalizeCategorySlug } from '@/lib/categories'

describe('normalizeCategorySlug', () => {
  it('maps legacy aliases to the active category slug', () => {
    expect(normalizeCategorySlug('integration-automation')).toBe('automation-workflow')
  })

  it('keeps known category slugs unchanged', () => {
    expect(normalizeCategorySlug('developer-tools')).toBe('developer-tools')
  })
})

describe('categories', () => {
  it('includes the normalized automation category', () => {
    expect(categories.some(category => category.slug === 'automation-workflow')).toBe(true)
  })
})
