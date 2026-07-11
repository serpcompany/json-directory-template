import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { prepareListingSource } from './listing-source-adapters.ts'

const workspaceRoot = process.cwd()
const testRoot = resolve(workspaceRoot, 'tmp', 'listing-source-adapters-test')
const exportPath = resolve(testRoot, 'd1-snapshot.json')
const outputPath = resolve(testRoot, 'listings.json')

afterEach(() => {
  rmSync(testRoot, { force: true, recursive: true })
})

describe('prepareListingSource', () => {
  it('materializes approved D1 snapshot records into listing JSON output', () => {
    mkdirSync(testRoot, { recursive: true })

    writeFileSync(
      exportPath,
      JSON.stringify(
        {
          rows: [
            {
              categoriesJson: '["video-downloaders"]',
              category: 'video-downloaders',
              content: null,
              createdAt: '2026-07-11T00:00:00.000Z',
              description: 'Approved listing',
              entityType: null,
              featured: 0,
              isUnofficial: 0,
              mediaJson: null,
              name: 'Approved Listing',
              priority: null,
              publishedAt: '2026-03-24',
              resourceLinksJson: null,
              siteId: 'serpdownloaders.com',
              slug: 'approved-listing',
              sourceUpdatedAt: '2026-07-11T00:00:00.000Z',
              status: 'approved',
              updatedAt: '2026-07-11T00:00:00.000Z',
              website: 'https://approved.example.com'
            },
            {
              categoriesJson: '["video-downloaders"]',
              category: 'video-downloaders',
              content: null,
              createdAt: '2026-07-11T00:00:00.000Z',
              description: 'Rejected listing',
              entityType: null,
              featured: 0,
              isUnofficial: 0,
              mediaJson: null,
              name: 'Rejected Listing',
              priority: null,
              publishedAt: '2026-03-24',
              resourceLinksJson: null,
              siteId: 'serpdownloaders.com',
              slug: 'rejected-listing',
              sourceUpdatedAt: '2026-07-11T00:00:00.000Z',
              status: 'rejected',
              updatedAt: '2026-07-11T00:00:00.000Z',
              website: 'https://rejected.example.com'
            }
          ],
          source: 'd1-public-listings',
          version: 1
        },
        null,
        2
      )
    )

    const result = prepareListingSource({
      content: {
        listingSource: {
          approvedOnly: true,
          exportPath,
          kind: 'd1-listings',
          outputPath
        }
      },
      id: 'serpdownloaders.com'
    } as never)

    expect(result).toMatchObject({
      outputPath,
      outputPathDisplay: outputPath,
      sourceKind: 'd1-listings',
      sourcePathDisplay: `${exportPath}#serpdownloaders.com`
    })
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toEqual([
      {
        categories: ['video-downloaders'],
        category: 'video-downloaders',
        description: 'Approved listing',
        name: 'Approved Listing',
        publishedAt: '2026-03-24',
        slug: 'approved-listing',
        website: 'https://approved.example.com'
      }
    ])
  })
})
