import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  d1RecordToWebsiteJsonEntry,
  readD1ListingExportEntries,
  websiteJsonEntryToD1Record
} from './d1-listing-records.ts'

const workspaceRoot = process.cwd()
const testRoot = resolve(workspaceRoot, 'tmp', 'd1-listing-records-test')
const exportPath = resolve(testRoot, 'snapshot.json')
const now = '2026-07-11T00:00:00.000Z'

beforeEach(() => {
  mkdirSync(testRoot, { recursive: true })
})

afterEach(() => {
  rmSync(testRoot, { force: true, recursive: true })
})

describe('D1 listing records', () => {
  it('round-trips website JSON entries through the D1 mirror record shape', () => {
    const record = websiteJsonEntryToD1Record(
      {
        categories: ['video-downloaders', 'social-media-downloaders'],
        content: 'Detailed content',
        description: 'Download videos.',
        featured: true,
        media: {
          logo: '/assets/example.png'
        },
        name: 'Example Downloader',
        publishedAt: '2026-03-24',
        resourceLinks: [
          {
            label: 'Docs',
            url: 'https://example.com/docs'
          }
        ],
        slug: 'example-downloader',
        website: 'https://example.com'
      },
      {
        now,
        siteId: 'serpdownloaders.com'
      }
    )

    expect(record).toMatchObject({
      category: 'video-downloaders',
      featured: 1,
      mediaJson: '{"logo":"/assets/example.png"}',
      siteId: 'serpdownloaders.com',
      status: 'approved'
    })
    expect(d1RecordToWebsiteJsonEntry(record)).toEqual({
      categories: ['video-downloaders', 'social-media-downloaders'],
      category: 'video-downloaders',
      content: 'Detailed content',
      description: 'Download videos.',
      entityType: undefined,
      featured: true,
      isUnofficial: undefined,
      media: {
        logo: '/assets/example.png'
      },
      name: 'Example Downloader',
      priority: undefined,
      publishedAt: '2026-03-24',
      resourceLinks: [
        {
          label: 'Docs',
          url: 'https://example.com/docs'
        }
      ],
      slug: 'example-downloader',
      website: 'https://example.com'
    })
  })

  it('reads only approved records for the requested site by default', () => {
    const approvedRecord = websiteJsonEntryToD1Record(
      {
        category: 'video-downloaders',
        description: 'Approved listing.',
        name: 'Approved Listing',
        publishedAt: '2026-03-24',
        slug: 'approved-listing',
        website: 'https://approved.example.com'
      },
      {
        now,
        siteId: 'serpdownloaders.com'
      }
    )
    const rejectedRecord = {
      ...approvedRecord,
      slug: 'rejected-listing',
      status: 'rejected' as const
    }
    const otherSiteRecord = {
      ...approvedRecord,
      siteId: 'serp.ai',
      slug: 'other-site-listing'
    }

    writeFileSync(
      exportPath,
      JSON.stringify(
        {
          rows: [approvedRecord, rejectedRecord, otherSiteRecord],
          source: 'd1-public-listings',
          version: 1
        },
        null,
        2
      )
    )

    expect(
      readD1ListingExportEntries({
        exportPath,
        siteId: 'serpdownloaders.com'
      }).map(entry => entry.slug)
    ).toEqual(['approved-listing'])
  })
})
