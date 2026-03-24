import {
  normalizeJsonWebsite,
  parseJsonWebsiteEntries,
  type WebsiteJsonEntry
} from '@/lib/website-schema'

function buildWebsiteEntry(overrides: Partial<WebsiteJsonEntry> = {}): WebsiteJsonEntry {
  return {
    category: 'developer-tools',
    description: 'A concise test description.',
    name: 'Example Project',
    publishedAt: '2026-03-22',
    website: 'https://example.com',
    ...overrides
  }
}

describe('parseJsonWebsiteEntries', () => {
  it('accepts a valid website entry with optional detail page content and resource links', () => {
    const entries = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        content: '## Overview\n\nThis is long-form detail page content.',
        entityType: 'movie',
        featured: true,
        priority: 'high',
        resourceLinks: [
          {
            label: 'Docs',
            url: 'https://example.com/docs'
          }
        ]
      })
    ])

    expect(entries).toHaveLength(1)
    expect(entries[0]?.content).toContain('Overview')
    expect(entries[0]?.entityType).toBe('movie')
    expect(entries[0]?.priority).toBe('high')
    expect(entries[0]?.resourceLinks).toEqual([
      {
        label: 'Docs',
        url: 'https://example.com/docs'
      }
    ])
  })

  it('rejects entries without a website or domain', () => {
    expect(() =>
      parseJsonWebsiteEntries([
        buildWebsiteEntry({
          domain: undefined,
          website: undefined
        })
      ])
    ).toThrow('website or domain')
  })
})

describe('normalizeJsonWebsite', () => {
  it('normalizes alias fields, sanitizes the description, and keeps optional content', () => {
    const [entry] = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        category: 'integration-automation',
        content: '## Details\n\nRendered on the detail page.',
        description: '<p>Supports <strong>HTML</strong> descriptions.</p>',
        domain: 'https://example.com',
        entityType: 'person',
        name: 'Example Project',
        resourceLinks: [
          {
            label: 'Support',
            url: 'https://example.com/support'
          }
        ],
        website: undefined
      })
    ])

    const normalized = normalizeJsonWebsite(entry)

    expect(normalized.category).toBe('automation-workflow')
    expect(normalized.content).toBe('## Details\n\nRendered on the detail page.')
    expect(normalized.description).toBe('Supports HTML descriptions.')
    expect(normalized.entityType).toBe('person')
    expect(normalized.resourceLinks).toEqual([
      {
        label: 'Support',
        url: 'https://example.com/support'
      }
    ])
    expect(normalized.slug).toBe('example-project')
    expect(normalized.website).toBe('https://example.com')
  })
})
