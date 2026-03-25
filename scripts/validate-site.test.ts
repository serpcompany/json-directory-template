import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./site-config.ts', () => ({
  loadCheckedInSiteFromInput: vi.fn(),
  parseSiteInputArgs: vi.fn()
}))

vi.mock('./run-context.ts', () => ({
  createRunTempDir: vi.fn()
}))

import { createRunTempDir } from './run-context.ts'
import { loadCheckedInSiteFromInput } from './site-config.ts'
import { validateSite } from './validate-site.ts'

const workspaceRoot = process.cwd()
const testRoot = resolve(workspaceRoot, 'tmp', 'validate-site-test')
const listingsPath = resolve(testRoot, 'fixtures', 'listings.json')
const runTempPath = resolve(testRoot, 'run')
const relativeListingsPath = 'tmp/validate-site-test/fixtures/listings.json'

const mockedCreateRunTempDir = vi.mocked(createRunTempDir)
const mockedLoadCheckedInSiteFromInput = vi.mocked(loadCheckedInSiteFromInput)

function writeListingsFile(entries: unknown): void {
  mkdirSync(resolve(listingsPath, '..'), { recursive: true })
  writeFileSync(listingsPath, JSON.stringify(entries, null, 2))
}

beforeEach(() => {
  mkdirSync(runTempPath, { recursive: true })

  mockedCreateRunTempDir.mockReturnValue({
    cleanup: () => {
      rmSync(runTempPath, { force: true, recursive: true })
    },
    path: runTempPath
  })

  mockedLoadCheckedInSiteFromInput.mockReturnValue({
    content: {
      listingSource: {
        kind: 'listing-json',
        path: relativeListingsPath
      }
    },
    id: 'test-site'
  } as never)
})

afterEach(() => {
  vi.clearAllMocks()
  rmSync(testRoot, { force: true, recursive: true })
})

describe('validateSite', () => {
  it('logs the active categories derived from listing data', () => {
    writeListingsFile([
      {
        category: 'developer-tools',
        description: 'Developer tool listing',
        name: 'Example Dev Tool',
        publishedAt: '2026-03-24',
        website: 'https://example.com'
      },
      {
        category: 'integration-automation',
        description: 'Automation listing',
        name: 'Example Automation Tool',
        publishedAt: '2026-03-24',
        website: 'https://automation.example.com'
      }
    ])

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    validateSite({ siteId: 'test-site' })

    expect(consoleLogSpy).toHaveBeenCalledWith('Valid site data for test-site — 2 entries')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Active categories for test-site: developer-tools, automation-workflow'
    )
  })

  it('fails validation when listing data includes an unknown category slug', () => {
    writeListingsFile([
      {
        category: 'made-up-category',
        description: 'Broken listing',
        name: 'Invalid Listing',
        publishedAt: '2026-03-24',
        website: 'https://invalid.example.com'
      }
    ])

    expect(() => validateSite({ siteId: 'test-site' })).toThrowError(
      'Validation failed for site test-site\nUnknown category slugs: made-up-category'
    )
  })
})
