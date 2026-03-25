import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./site-config.ts', () => ({
  loadCheckedInSiteFromInput: vi.fn(),
}));

import { loadCheckedInSiteFromInput } from './site-config.ts';
import { syncListingLogos } from './sync-listing-logos.ts';

const workspaceRoot = process.cwd();
const testRoot = resolve(workspaceRoot, 'tmp', 'sync-listing-logos-test');
const sourcePath = 'tmp/sync-listing-logos-test/products.json';
const manifestPath = 'tmp/sync-listing-logos-test/logo-sources.json';
const absoluteSourcePath = resolve(workspaceRoot, sourcePath);
const absoluteManifestPath = resolve(workspaceRoot, manifestPath);
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

describe('syncListingLogos', () => {
  it('downloads listed logos into the public asset folder and rewrites source media.logo paths', async () => {
    writeFileSync(
      absoluteSourcePath,
      JSON.stringify(
        {
          'example-downloader': {
            product: {
              productPage: 'https://serp.ly/example-downloader',
              slug: 'example-downloader',
              title: 'Example Downloader',
            },
          },
        },
        null,
        2
      )
    );

    writeFileSync(
      absoluteManifestPath,
      JSON.stringify(
        [
          {
            slug: 'example-downloader',
            sourceUrl: 'https://cdn.example.com/example-downloader/logo.png',
          },
        ],
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

    const result = await syncListingLogos(
      { siteId: 'test-site' },
      {
        fetchImpl: vi.fn().mockResolvedValue({
          arrayBuffer: () => Promise.resolve(Uint8Array.from([1, 2, 3]).buffer),
          headers: new Headers({
            'content-type': 'image/png',
          }),
          ok: true,
        }) as never,
        manifestPath,
      }
    );

    expect(result).toEqual({
      manifestPathDisplay: manifestPath,
      outputDirDisplay: 'apps/web/public/listing-logos/test-site',
      siteId: 'test-site',
      sourcePathDisplay: sourcePath,
      syncedCount: 1,
    });

    expect(
      readFileSync(
        resolve(outputDir, 'example-downloader.png')
      )
    ).toEqual(Buffer.from([1, 2, 3]));

    expect(
      JSON.parse(readFileSync(absoluteSourcePath, 'utf8'))[
        'example-downloader'
      ].media
    ).toEqual({
      logo: '/listing-logos/test-site/example-downloader.png',
    });
  });

  it('skips manifest entries without a sourceUrl', async () => {
    writeFileSync(
      absoluteSourcePath,
      JSON.stringify(
        {
          'example-downloader': {
            product: {
              productPage: 'https://serp.ly/example-downloader',
              slug: 'example-downloader',
              title: 'Example Downloader',
            },
          },
        },
        null,
        2
      )
    );

    writeFileSync(
      absoluteManifestPath,
      JSON.stringify(
        [
          {
            slug: 'example-downloader',
            sourceUrl: null,
          },
        ],
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

    const fetchImpl = vi.fn();

    const result = await syncListingLogos(
      { siteId: 'test-site' },
      {
        fetchImpl: fetchImpl as never,
        manifestPath,
      }
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.syncedCount).toBe(0);
    expect(
      JSON.parse(readFileSync(absoluteSourcePath, 'utf8'))[
        'example-downloader'
      ].media
    ).toBeUndefined();
  });
});
