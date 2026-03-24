import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureStagedBrandAssetSource,
  resolveStagedBrandAssetPath,
} from './build-site.ts';

const workspaceRoot = process.cwd();
const siteId = 'remote-asset-test';
const siteAssetsDir = resolve(workspaceRoot, 'sites', siteId, 'assets');

beforeEach(() => {
  mkdirSync(siteAssetsDir, { recursive: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  rmSync(resolve(workspaceRoot, 'sites', siteId), {
    force: true,
    recursive: true,
  });
});

describe('ensureStagedBrandAssetSource', () => {
  it('downloads a missing remote logo into the deterministic staged local asset path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(Uint8Array.from([137, 80, 78, 71]), {
          headers: {
            'content-type': 'image/png',
          },
          status: 200,
        })
      )
    );

    const stagedPath = await ensureStagedBrandAssetSource({
      asset: {
        source: 'url',
        url: 'https://cdn.example.com/logo.png',
      },
      assetKind: 'logo',
      siteId,
      workspaceRoot,
    });

    expect(stagedPath).toBe(
      resolveStagedBrandAssetPath({ assetKind: 'logo', siteId, workspaceRoot })
    );
    expect(existsSync(stagedPath)).toBe(true);
    expect(Array.from(readFileSync(stagedPath))).toEqual([137, 80, 78, 71]);
  });

  it('reuses an existing staged local file instead of downloading the remote asset again', async () => {
    const stagedPath = resolveStagedBrandAssetPath({
      assetKind: 'favicon',
      siteId,
      workspaceRoot,
    });
    const fetchMock = vi.fn();

    mkdirSync(siteAssetsDir, { recursive: true });
    writeFileSync(stagedPath, Uint8Array.from([0, 0, 1, 0]));
    vi.stubGlobal('fetch', fetchMock);

    const reusedPath = await ensureStagedBrandAssetSource({
      asset: {
        source: 'url',
        url: 'https://cdn.example.com/favicon.ico',
      },
      assetKind: 'favicon',
      siteId,
      workspaceRoot,
    });

    expect(reusedPath).toBe(stagedPath);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails early when a remote asset does not match the expected file constraints', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(Uint8Array.from([255, 216, 255]), {
          headers: {
            'content-type': 'image/jpeg',
          },
          status: 200,
        })
      )
    );

    await expect(
      ensureStagedBrandAssetSource({
        asset: {
          source: 'url',
          url: 'https://cdn.example.com/logo.jpg',
        },
        assetKind: 'logo',
        siteId,
        workspaceRoot,
      })
    ).rejects.toThrow(
      'Remote logo asset for site remote-asset-test must be image/png before it can be staged locally.'
    );
  });
});
