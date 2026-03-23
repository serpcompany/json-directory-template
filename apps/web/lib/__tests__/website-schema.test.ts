import {
  normalizeJsonWebsite,
  parseJsonWebsiteEntries,
  type WebsiteJsonEntry
} from '@/lib/website-schema'

function buildWebsiteEntry(overrides: Partial<WebsiteJsonEntry> = {}): WebsiteJsonEntry {
  return {
    category: 'developer-tools',
    description: 'A concise test description.',
    llmsUrl: 'https://example.com/llms.txt',
    name: 'Example Project',
    publishedAt: '2026-03-22',
    website: 'https://example.com',
    ...overrides
  }
}

describe('parseJsonWebsiteEntries', () => {
  it('accepts a valid website entry with optional detail page content', () => {
    const entries = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        content: '## Overview\n\nThis is long-form detail page content.',
        featured: true,
        llmsFullUrl: 'https://example.com/llms-full.txt',
        priority: 'high'
      })
    ])

    expect(entries).toHaveLength(1)
    expect(entries[0]?.content).toContain('Overview')
    expect(entries[0]?.priority).toBe('high')
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

  it('rejects entries without an llms URL', () => {
    expect(() =>
      parseJsonWebsiteEntries([
        buildWebsiteEntry({
          llmsTxtUrl: undefined,
          llmsUrl: undefined
        })
      ])
    ).toThrow('llmsUrl or llmsTxtUrl')
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
        llmsTxtUrl: 'https://example.com/llms.txt',
        name: 'Example Project',
        website: undefined
      })
    ])

    const normalized = normalizeJsonWebsite(entry)

    expect(normalized.category).toBe('automation-workflow')
    expect(normalized.content).toBe('## Details\n\nRendered on the detail page.')
    expect(normalized.description).toBe('Supports HTML descriptions.')
    expect(normalized.llmsUrl).toBe('https://example.com/llms.txt')
    expect(normalized.slug).toBe('example-project')
    expect(normalized.website).toBe('https://example.com')
  })
})
