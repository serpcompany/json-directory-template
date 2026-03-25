import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./site-config.ts', () => ({
  loadCheckedInSiteFromInput: vi.fn(),
}));

vi.mock('./trial-build.ts', () => ({
  writeTrialWebsiteEntries: vi.fn(),
}));

import { loadCheckedInSiteFromInput } from './site-config.ts';
import { prepareSiteData } from './site-data.ts';
import { writeTrialWebsiteEntries } from './trial-build.ts';

const workspaceRoot = process.cwd();
const testRoot = resolve(workspaceRoot, 'tmp', 'site-data-test');
const inputPath = resolve(testRoot, 'input.json');
const outputPath = resolve(testRoot, 'nested', 'output.json');
const relativeInputPath = 'tmp/site-data-test/input.json';
const relativeOutputPath = 'tmp/site-data-test/nested/output.json';

const mockedLoadCheckedInSiteFromInput = vi.mocked(loadCheckedInSiteFromInput);
const mockedWriteTrialWebsiteEntries = vi.mocked(writeTrialWebsiteEntries);

beforeEach(() => {
  mkdirSync(testRoot, { recursive: true });
});

afterEach(() => {
  vi.clearAllMocks();
  rmSync(testRoot, { force: true, recursive: true });
});

describe('prepareSiteData', () => {
  it('copies listing-json source data into the normalized output path', () => {
    writeFileSync(
      inputPath,
      JSON.stringify([{ name: 'Example Listing' }], null, 2)
    );

    mockedLoadCheckedInSiteFromInput.mockReturnValue({
      content: {
        listingSource: {
          kind: 'listing-json',
          outputPath: relativeOutputPath,
          path: relativeInputPath,
        },
      },
      id: 'test-site',
    } as never);

    const result = prepareSiteData({ siteId: 'test-site' });

    expect(result).toEqual({
      outputPath,
      outputPathDisplay: relativeOutputPath,
      siteId: 'test-site',
      sourceKind: 'listing-json',
      sourcePathDisplay: relativeInputPath,
    });
    expect(readFileSync(outputPath, 'utf8')).toContain('Example Listing');
    expect(mockedWriteTrialWebsiteEntries).not.toHaveBeenCalled();
  });

  it('runs the trial-products adapter when the site source requires it', () => {
    mockedLoadCheckedInSiteFromInput.mockReturnValue({
      content: {
        listingSource: {
          category: 'automation-workflow',
          featuredCount: 6,
          kind: 'trial-products-json',
          outputPath: relativeOutputPath,
          path: 'sites/test-site/products.json',
          publishedAt: '2026-03-24',
        },
      },
      id: 'test-site',
    } as never);

    const result = prepareSiteData({ siteId: 'test-site' });

    expect(result).toEqual({
      outputPath,
      outputPathDisplay: relativeOutputPath,
      siteId: 'test-site',
      sourceKind: 'trial-products-json',
      sourcePathDisplay: 'sites/test-site/products.json',
    });
    expect(mockedWriteTrialWebsiteEntries).toHaveBeenCalledWith(
      'sites/test-site/products.json',
      relativeOutputPath,
      {
        category: 'automation-workflow',
        featuredCount: 6,
        publishedAt: '2026-03-24',
      }
    );
  });
});
