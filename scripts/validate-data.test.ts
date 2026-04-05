import { describe, expect, it } from 'vitest';
import { validateListingData } from './validate-data.ts';

describe('validateListingData', () => {
  it('accepts canonical starter category slugs', () => {
    expect(
      validateListingData([
        {
          category: 'developer-tools',
          description: 'Example entry',
          name: 'Example Project',
          publishedAt: '2026-04-05',
          website: 'https://example.com',
        },
      ])
    ).toBe(1);
  });

  it('accepts known legacy aliases through normalization', () => {
    expect(
      validateListingData([
        {
          category: 'automation-workflow',
          description: 'Example entry',
          name: 'Example Project',
          publishedAt: '2026-04-05',
          website: 'https://example.com',
        },
      ])
    ).toBe(1);
  });

  it('rejects unknown category slugs', () => {
    expect(() =>
      validateListingData(
        [
          {
            category: 'made-up-category',
            description: 'Example entry',
            name: 'Example Project',
            publishedAt: '2026-04-05',
            website: 'https://example.com',
          },
        ],
        'tmp/test-listings.json'
      )
    ).toThrowError(/Unknown category slugs: made-up-category/);
  });
});
