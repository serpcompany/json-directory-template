import { resolveListingDetailTemplate } from '@/lib/listing-detail-template'

describe('resolveListingDetailTemplate', () => {
  it('returns the matching template for supported entity types', () => {
    expect(resolveListingDetailTemplate('movie')).toBe('movie')
    expect(resolveListingDetailTemplate('person')).toBe('person')
    expect(resolveListingDetailTemplate('product')).toBe('product')
  })

  it('falls back to the default template for missing or unknown entity types', () => {
    expect(resolveListingDetailTemplate()).toBe('default')
    expect(resolveListingDetailTemplate('company')).toBe('default')
  })
})
