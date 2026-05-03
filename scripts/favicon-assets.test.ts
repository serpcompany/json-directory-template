import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const removedLlmsTxtFaviconHash =
  '1cd60f1ce4343b36701e4651251f29c3e2bc4067b495853c84d5fdfc8f7a133b';
const approvedSerpFaviconHash =
  '80c7fbfcd31b893f98c428a482b742ee6ec1b64e9a3da3bf5b1bc5d6f93e48c2';

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('favicon assets', () => {
  it('does not keep the old llms.txt favicon in checked-in app or site assets', () => {
    const faviconPaths = [
      'apps/pornvideodownloaders.com/app/favicon.ico',
      'apps/serpdownloaders.com/app/favicon.ico',
      'apps/starter/app/favicon.ico',
      'sites/pornvideodownloaders.com/assets/favicon.ico',
      'sites/serpdownloaders.com/assets/favicon.ico',
    ];

    expect(
      faviconPaths.map((path) => ({
        hash: sha256(path),
        path,
      }))
    ).not.toContainEqual(
      expect.objectContaining({
        hash: removedLlmsTxtFaviconHash,
      })
    );
  });

  it('uses the site-owned favicon in the pornvideodownloaders wrapper', () => {
    expect(sha256('apps/pornvideodownloaders.com/app/favicon.ico')).toBe(
      sha256('sites/pornvideodownloaders.com/assets/favicon.ico')
    );
  });

  it('uses the approved SERP favicon across checked-in app and site favicon assets', () => {
    const faviconPaths = [
      'apps/pornvideodownloaders.com/app/favicon.ico',
      'apps/serpdownloaders.com/app/favicon.ico',
      'apps/starter/app/favicon.ico',
      'sites/pornvideodownloaders.com/assets/favicon.ico',
      'sites/serpdownloaders.com/assets/favicon.ico',
    ];

    expect(
      faviconPaths.map((path) => ({
        hash: sha256(path),
        path,
      }))
    ).toEqual(
      faviconPaths.map((path) => ({
        hash: approvedSerpFaviconHash,
        path,
      }))
    );
  });
});
