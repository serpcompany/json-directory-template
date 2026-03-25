import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./site-config.ts', () => ({
  loadCheckedInSiteFromInput: vi.fn(),
  parseSiteInputArgs: vi.fn(),
}));

vi.mock('./run-context.ts', () => ({
  createRunTempDir: vi.fn(),
}));

vi.mock('./trial-build.ts', () => ({
  writeTrialWebsiteEntries: vi.fn(),
}));

import { createRunTempDir } from './run-context.ts';
import { loadCheckedInSiteFromInput } from './site-config.ts';
import { writeTrialWebsiteEntries } from './trial-build.ts';
import { validateSite } from './validate-site.ts';

const workspaceRoot = process.cwd();
const testRoot = resolve(workspaceRoot, 'tmp', 'validate-site-test');
const listingsPath = resolve(testRoot, 'fixtures', 'listings.json');
const runTempPath = resolve(testRoot, 'run');
const relativeListingsPath = 'tmp/validate-site-test/fixtures/listings.json';

const mockedCreateRunTempDir = vi.mocked(createRunTempDir);
const mockedLoadCheckedInSiteFromInput = vi.mocked(loadCheckedInSiteFromInput);
const mockedWriteTrialWebsiteEntries = vi.mocked(writeTrialWebsiteEntries);

function writeListingsFile(entries: unknown): void {
  mkdirSync(resolve(listingsPath, '..'), { recursive: true });
  writeFileSync(listingsPath, JSON.stringify(entries, null, 2));
}

beforeEach(() => {
  mkdirSync(runTempPath, { recursive: true });

  mockedCreateRunTempDir.mockReturnValue({
    cleanup: () => {
      rmSync(runTempPath, { force: true, recursive: true });
    },
    path: runTempPath,
  });

  mockedLoadCheckedInSiteFromInput.mockReturnValue({
    content: {
      listingSource: {
        kind: 'listing-json',
        path: relativeListingsPath,
      },
    },
    id: 'test-site',
  } as never);
});

afterEach(() => {
  vi.clearAllMocks();
  rmSync(testRoot, { force: true, recursive: true });
});

describe('validateSite', () => {
  it('logs the active categories derived from listing data', () => {
    writeListingsFile([
      {
        category: 'developer-tools',
        description: 'Developer tool listing',
        name: 'Example Dev Tool',
        publishedAt: '2026-03-24',
        website: 'https://example.com',
      },
      {
        category: 'integration-automation',
        description: 'Automation listing',
        name: 'Example Automation Tool',
        publishedAt: '2026-03-24',
        website: 'https://automation.example.com',
      },
    ]);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    validateSite({ siteId: 'test-site' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Valid site data for test-site — 2 entries'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Active categories for test-site: developer-tools, video-downloaders'
    );
  });

  it('fails validation when listing data includes an unknown category slug', () => {
    writeListingsFile([
      {
        category: 'made-up-category',
        description: 'Broken listing',
        name: 'Invalid Listing',
        publishedAt: '2026-03-24',
        website: 'https://invalid.example.com',
      },
    ]);

    expect(() => validateSite({ siteId: 'test-site' })).toThrowError(
      [
        'Validation failed for site test-site',
        'Unknown category slugs: made-up-category',
        `Update the category values in ${relativeListingsPath} or add the slug to apps/web/lib/categories.ts.`,
      ].join('\n')
    );
  });

  it('points trial-products sites at the site config category field', () => {
    mockedLoadCheckedInSiteFromInput.mockReturnValue({
      content: {
        listingSource: {
          category: 'video-downloaders',
          featuredCount: 6,
          kind: 'trial-products-json',
          outputPath: 'data/listings.json',
          path: 'sites/test-site/products.json',
          publishedAt: '2026-03-24',
        },
      },
      id: 'test-site',
    } as never);

    mockedWriteTrialWebsiteEntries.mockImplementation(
      (_inputPath, outputPath) => {
        writeFileSync(
          outputPath,
          JSON.stringify(
            [
              {
                category: 'made-up-category',
                description: 'Broken listing',
                name: 'Invalid Listing',
                publishedAt: '2026-03-24',
                website: 'https://invalid.example.com',
              },
            ],
            null,
            2
          )
        );
      }
    );

    expect(() => validateSite({ siteId: 'test-site' })).toThrowError(
      [
        'Validation failed for site test-site',
        'Unknown category slugs: made-up-category',
        'Update content.listingSource.category in sites/test-site/site-config.ts or add the slug to apps/web/lib/categories.ts.',
      ].join('\n')
    );
  });
});
