import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const removedSerpLogoHash =
  'a3b2bca6e164b14b324e246226cf7d17bf5ebfb7ac1efabd5c5687f56a0440d4';
const removedLlmsTxtOpenGraphHash =
  'bc642e4f3d5f2293cf8125f97baa81b941dc3b2ef27a0c88654d5f8a3f1d5c4f';
const approvedBlackLogoHash =
  '63f7b9e39db4edcdfea0e852b21c950f8a50ee1e7b516f89e91e08d6052e588f';

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('logo assets', () => {
  const logoPaths = [
    'apps/pornvideodownloaders.com/public/apple-touch-icon.png',
    'apps/pornvideodownloaders.com/public/logo.png',
    'apps/serpdownloaders.com/public/apple-touch-icon.png',
    'apps/serpdownloaders.com/public/logo.png',
    'sites/pornvideodownloaders.com/assets/logo.png',
    'sites/serpdownloaders.com/assets/logo.png',
  ];

  it('does not keep old SERP or llms.txt logo-like images in checked-in app or site assets', () => {
    const hashes = logoPaths.map((path) => ({
      hash: sha256(path),
      path,
    }));

    expect(hashes).not.toContainEqual(
      expect.objectContaining({
        hash: removedSerpLogoHash,
      })
    );
    expect(hashes).not.toContainEqual(
      expect.objectContaining({
        hash: removedLlmsTxtOpenGraphHash,
      })
    );
  });

  it('uses the approved black logo image across checked-in app and site logo assets', () => {
    expect(
      logoPaths.map((path) => ({
        hash: sha256(path),
        path,
      }))
    ).toEqual(
      logoPaths.map((path) => ({
        hash: approvedBlackLogoHash,
        path,
      }))
    );
  });
});
