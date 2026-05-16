import { describe, expect, it } from 'vitest';
import { buildSearchIndex } from './search-index-generator.ts';

describe('buildSearchIndex', () => {
  it('emits the configured public listing URL for each entry', () => {
    const index = buildSearchIndex(
      [
        {
          category: 'automation-workflow',
          categories: ['automation-workflow', 'developer-tools'],
          description: 'Example description',
          name: 'Example Listing',
          publishedAt: '2026-03-23',
          website: 'https://example.com',
        },
      ],
      '/directory'
    );

    expect(index).toEqual([
      {
        category: 'automation-workflow',
        categories: ['automation-workflow', 'developer-tools'],
        content: '',
        description: 'Example description',
        name: 'Example Listing',
        slug: 'example-listing',
        url: '/directory/example-listing',
        website: 'https://example.com',
      },
    ]);
  });

  it('preserves an explicit entry url when one is already present', () => {
    const index = buildSearchIndex(
      [
        {
          category: 'developer-tools',
          description: 'Explicit route entry',
          name: 'Explicit Listing',
          publishedAt: '2026-03-23',
          slug: 'explicit-listing',
          url: '/custom/explicit-listing',
          website: 'https://example.com',
        },
      ],
      '/directory'
    );

    expect(index[0]?.url).toBe('/custom/explicit-listing');
    expect(index[0]?.categories).toEqual(['developer-tools']);
  });

  it('does not emit full listing body content into the client search index', () => {
    const index = buildSearchIndex(
      [
        {
          category: 'developer-tools',
          content: 'Long imported listing body that should stay out of the browser search index.',
          description: 'Searchable summary',
          name: 'Compact Listing',
          slug: 'compact-listing',
          website: 'https://example.com',
        },
      ],
      '/directory'
    );

    expect(index[0]?.content).toBe('');
    expect(index[0]?.description).toBe('Searchable summary');
  });
});
