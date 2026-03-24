import { describe, expect, it } from 'vitest'
import { buildSearchIndex } from './search-index-generator.ts'

describe('buildSearchIndex', () => {
  it('emits the configured public listing URL for each entry', () => {
    const index = buildSearchIndex(
      [
        {
          category: 'automation-workflow',
          description: 'Example description',
          llmsUrl: 'https://example.com/llms.txt',
          name: 'Example Listing',
          publishedAt: '2026-03-23',
          website: 'https://example.com'
        }
      ],
      '/directory'
    )

    expect(index).toEqual([
      {
        category: 'automation-workflow',
        content: '',
        description: 'Example description',
        llmsFullUrl: '',
        llmsUrl: 'https://example.com/llms.txt',
        name: 'Example Listing',
        slug: 'example-listing',
        url: '/directory/example-listing',
        website: 'https://example.com'
      }
    ])
  })

  it('preserves an explicit entry url when one is already present', () => {
    const index = buildSearchIndex(
      [
        {
          category: 'developer-tools',
          description: 'Explicit route entry',
          llmsUrl: 'https://example.com/llms.txt',
          name: 'Explicit Listing',
          publishedAt: '2026-03-23',
          slug: 'explicit-listing',
          url: '/custom/explicit-listing',
          website: 'https://example.com'
        }
      ],
      '/directory'
    )

    expect(index[0]?.url).toBe('/custom/explicit-listing')
  })
})
