import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./site-config.ts', () => ({
  loadCheckedInSiteFromInput: vi.fn(),
}));

import { loadCheckedInSiteFromInput } from './site-config.ts';
import { normalizeListingLogosToPng } from './normalize-listing-logos-to-png.ts';

const workspaceRoot = process.cwd();
const testRoot = resolve(workspaceRoot, 'tmp', 'normalize-listing-logos-test');
const sourcePath = 'tmp/normalize-listing-logos-test/products.json';
const absoluteSourcePath = resolve(workspaceRoot, sourcePath);
const outputDir = resolve(
  workspaceRoot,
  'apps',
  'web',
  'public',
  'listing-logos',
  'test-site'
);

const mockedLoadCheckedInSiteFromInput = vi.mocked(loadCheckedInSiteFromInput);

beforeEach(() => {
  mkdirSync(testRoot, { recursive: true });
  mkdirSync(outputDir, { recursive: true });
});

afterEach(() => {
  vi.clearAllMocks();
  rmSync(testRoot, { force: true, recursive: true });
  rmSync(outputDir, { force: true, recursive: true });
});

describe('normalizeListingLogosToPng', () => {
  it('converts non-png local logos to png and rewrites media.logo', async () => {
    writeFileSync(
      absoluteSourcePath,
      JSON.stringify(
        {
          'example-downloader': {
            media: {
              logo: '/listing-logos/test-site/example-downloader.ico',
            },
            product: {
              productPage: 'https://serp.ly/example-downloader',
              slug: 'example-downloader',
              title: 'Example Downloader',
            },
          },
          'already-good': {
            media: {
              logo: '/listing-logos/test-site/already-good.png',
            },
            product: {
              productPage: 'https://serp.ly/already-good',
              slug: 'already-good',
              title: 'Already Good',
            },
          },
        },
        null,
        2
      )
    );

    writeFileSync(resolve(outputDir, 'example-downloader.ico'), 'ico');
    writeFileSync(resolve(outputDir, 'already-good.png'), 'png');

    mockedLoadCheckedInSiteFromInput.mockReturnValue({
      content: {
        listingSource: {
          kind: 'trial-products-json',
          outputPath: 'data/listings.json',
          path: sourcePath,
        },
      },
      id: 'test-site',
    } as never);

    const convertImpl = vi.fn((inputPath: string, outputPath: string) => {
      writeFileSync(outputPath, `converted:${inputPath}`);
    });

    const result = await normalizeListingLogosToPng(
      { siteId: 'test-site' },
      { convertImpl }
    );

    expect(result).toEqual({
      convertedCount: 1,
      siteId: 'test-site',
      sourcePathDisplay: sourcePath,
    });
    expect(convertImpl).toHaveBeenCalledTimes(1);
    expect(
      readFileSync(resolve(outputDir, 'example-downloader.png'), 'utf8')
    ).toContain('example-downloader.ico');

    expect(
      JSON.parse(readFileSync(absoluteSourcePath, 'utf8'))['example-downloader']
        .media.logo
    ).toBe('/listing-logos/test-site/example-downloader.png');
    expect(
      JSON.parse(readFileSync(absoluteSourcePath, 'utf8'))['already-good'].media
        .logo
    ).toBe('/listing-logos/test-site/already-good.png');
  });

  it('skips non-png logo paths whose source files are already missing', async () => {
    writeFileSync(
      absoluteSourcePath,
      JSON.stringify(
        {
          'missing-downloader': {
            media: {
              logo: '/listing-logos/test-site/missing-downloader.ico',
            },
            product: {
              productPage: 'https://serp.ly/missing-downloader',
              slug: 'missing-downloader',
              title: 'Missing Downloader',
            },
          },
        },
        null,
        2
      )
    );

    mockedLoadCheckedInSiteFromInput.mockReturnValue({
      content: {
        listingSource: {
          kind: 'trial-products-json',
          outputPath: 'data/listings.json',
          path: sourcePath,
        },
      },
      id: 'test-site',
    } as never);

    const convertImpl = vi.fn();

    const result = await normalizeListingLogosToPng(
      { siteId: 'test-site' },
      { convertImpl }
    );

    expect(result).toEqual({
      convertedCount: 0,
      siteId: 'test-site',
      sourcePathDisplay: sourcePath,
    });
    expect(convertImpl).not.toHaveBeenCalled();
    expect(
      JSON.parse(readFileSync(absoluteSourcePath, 'utf8'))['missing-downloader']
        .media.logo
    ).toBe('/listing-logos/test-site/missing-downloader.ico');
  });
});
