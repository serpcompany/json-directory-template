import { describe, expect, it } from 'vitest';
import { getActiveCheckedInSiteIds } from './validate-active-sites.ts';

describe('getActiveCheckedInSiteIds', () => {
  it('derives the active checked-in site ids from the live registry only', () => {
    expect(getActiveCheckedInSiteIds()).toEqual([
      'pornvideodownloaders.com',
      'serpdownloaders.com',
    ]);
  });
});
