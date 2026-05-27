import { describe, expect, it } from 'vitest'
import {
  buildWebsiteLookupIndex,
  resolveWebsiteBySlug,
  resolveWebsiteBySlugFromIndex,
  type WebsiteMetadata
} from './content-query'

const websites: WebsiteMetadata[] = [
  {
    slug: 'newer-listing',
    name: 'Newer Listing',
    description: 'Newer listing.',
    website: 'https://newer.example.com',
    category: 'alpha',
    categories: ['alpha'],
    publishedAt: '2026-01-03'
  },
  {
    slug: 'target-listing',
    name: 'Target Listing',
    description: 'Target listing.',
    website: 'https://target.example.com',
    category: 'alpha',
    categories: ['alpha', 'beta'],
    publishedAt: '2026-01-02',
    content: 'Target listing body.'
  },
  {
    slug: 'older-listing',
    name: 'Older Listing',
    description: 'Older listing.',
    website: 'https://older.example.com',
    category: 'beta',
    categories: ['beta'],
    publishedAt: '2026-01-01'
  },
  {
    slug: 'unrelated-listing',
    name: 'Unrelated Listing',
    description: 'Unrelated listing.',
    website: 'https://unrelated.example.com',
    category: 'gamma',
    categories: ['gamma'],
    publishedAt: '2025-12-31'
  }
]

describe('website lookup index', () => {
  it('resolves details with previous and next entries from the provided ordering', () => {
    const detail = resolveWebsiteBySlugFromIndex(
      buildWebsiteLookupIndex(websites),
      'target-listing'
    )

    expect(detail?.slug).toBe('target-listing')
    expect(detail?.content).toBe('Target listing body.')
    expect(detail?.previousWebsite?.slug).toBe('newer-listing')
    expect(detail?.nextWebsite?.slug).toBe('older-listing')
  })

  it('keeps the related listing algorithm ordered by shared categories then name', () => {
    const detail = resolveWebsiteBySlugFromIndex(
      buildWebsiteLookupIndex(websites),
      'target-listing'
    )

    expect(detail?.relatedWebsites.map(website => website.slug)).toEqual([
      'newer-listing',
      'older-listing'
    ])
  })

  it('preserves first-match slug semantics for duplicate slugs', () => {
    const firstDuplicate = {
      ...websites[0],
      slug: 'duplicate-listing',
      name: 'First Duplicate'
    }
    const secondDuplicate = {
      ...websites[2],
      slug: 'duplicate-listing',
      name: 'Second Duplicate'
    }
    const duplicateWebsites = [firstDuplicate, websites[1], secondDuplicate]
    const index = buildWebsiteLookupIndex(duplicateWebsites)

    expect(index.websiteBySlug.get('duplicate-listing')).toBe(firstDuplicate)
    expect(index.websiteIndexBySlug.get('duplicate-listing')).toBe(0)
    expect(resolveWebsiteBySlugFromIndex(index, 'duplicate-listing')?.name).toBe('First Duplicate')
  })

  it('keeps the existing array-scan resolver output compatible', () => {
    expect(resolveWebsiteBySlug(websites, 'target-listing')).toEqual(
      resolveWebsiteBySlugFromIndex(buildWebsiteLookupIndex(websites), 'target-listing')
    )
  })
})
