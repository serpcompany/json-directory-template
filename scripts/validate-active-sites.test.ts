import { describe, expect, it } from 'vitest';
import { getActiveCheckedInSiteIds } from './validate-active-sites.ts';

describe('getActiveCheckedInSiteIds', () => {
  it('keeps the default site first and derives the remaining checked-in site ids generically', () => {
    expect(getActiveCheckedInSiteIds()).toEqual([
      'default',
      'serp.co',
      'serp.software',
      'serpdownloaders.com',
    ]);
  });
});
