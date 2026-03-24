import {
  canTransformToWebsiteMetadata,
  matchesSearchQuery,
  transformToWebsiteMetadata
} from '@/components/search/search-utils'
import type { SearchIndexEntry } from '@/lib/search-index'

const entry: SearchIndexEntry = {
  category: 'automation-workflow',
  content: 'Helpful content',
  description: 'Browser automation listing',
  name: 'Example Listing',
  slug: 'example-listing',
  url: '/websites/example-listing',
  website: 'https://example.com'
}

describe('search-utils', () => {
  it('accepts the canonical search index shape', () => {
    expect(canTransformToWebsiteMetadata(entry)).toBe(true)
  })

  it('uses the generated listing url and category when transforming metadata', () => {
    expect(transformToWebsiteMetadata(entry)).toEqual({
      url: '/websites/example-listing',
      slug: 'example-listing',
      website: 'https://example.com',
      name: 'Example Listing',
      description: 'Browser automation listing',
      categories: ['automation-workflow'],
      tags: [],
      category: 'automation-workflow',
      publishedAt: ''
    })
  })

  it('matches search queries against the canonical fields only', () => {
    expect(matchesSearchQuery(entry, 'browser automation')).toBe(true)
    expect(matchesSearchQuery(entry, 'websites')).toBe(true)
    expect(matchesSearchQuery(entry, 'missing term')).toBe(false)
  })
})
