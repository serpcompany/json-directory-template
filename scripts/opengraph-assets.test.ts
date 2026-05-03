import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const removedLlmsTxtOpenGraphHash =
  'bc642e4f3d5f2293cf8125f97baa81b941dc3b2ef27a0c88654d5f8a3f1d5c4f';
const approvedBlackOpenGraphHash =
  'f88bb6c8d03293fe93a101f3891b9d85c00ac7511884127d5e18927318d71eb9';

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('Open Graph assets', () => {
  const openGraphPaths = [
    'apps/pornvideodownloaders.com/app/opengraph-image.png',
    'apps/serpdownloaders.com/app/opengraph-image.png',
    'apps/starter/app/opengraph-image.png',
    'sites/pornvideodownloaders.com/assets/opengraph-image.png',
    'sites/serpdownloaders.com/assets/opengraph-image.png',
  ];

  it('does not keep the old llms.txt hub Open Graph image in checked-in app or site assets', () => {
    expect(
      openGraphPaths.map((path) => ({
        hash: sha256(path),
        path,
      }))
    ).not.toContainEqual(
      expect.objectContaining({
        hash: removedLlmsTxtOpenGraphHash,
      })
    );
  });

  it('uses the approved black Open Graph image across checked-in app and site assets', () => {
    expect(
      openGraphPaths.map((path) => ({
        hash: sha256(path),
        path,
      }))
    ).toEqual(
      openGraphPaths.map((path) => ({
        hash: approvedBlackOpenGraphHash,
        path,
      }))
    );
  });
});
