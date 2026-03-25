import {
  normalizeJsonWebsite,
  parseJsonWebsiteEntries,
  type WebsiteJsonEntry,
} from '@/lib/website-schema';

function buildWebsiteEntry(
  overrides: Partial<WebsiteJsonEntry> = {}
): WebsiteJsonEntry {
  return {
    category: 'developer-tools',
    description: 'A concise test description.',
    name: 'Example Project',
    publishedAt: '2026-03-22',
    website: 'https://example.com',
    ...overrides,
  };
}

describe('parseJsonWebsiteEntries', () => {
  it('accepts a valid website entry with optional detail page content and resource links', () => {
    const entries = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        categories: ['developer-tools', 'video-downloaders'],
        content: '## Overview\n\nThis is long-form detail page content.',
        entityType: 'movie',
        featured: true,
        media: {
          images: ['https://cdn.example.com/example-1.png'],
          logo: 'https://cdn.example.com/logo.png',
          video: 'https://cdn.example.com/demo.mp4',
        },
        priority: 'high',
        resourceLinks: [
          {
            label: 'Docs',
            url: 'https://example.com/docs',
          },
        ],
      }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.content).toContain('Overview');
    expect(entries[0]?.categories).toEqual([
      'developer-tools',
      'video-downloaders',
    ]);
    expect(entries[0]?.entityType).toBe('movie');
    expect(entries[0]?.media).toEqual({
      images: ['https://cdn.example.com/example-1.png'],
      logo: 'https://cdn.example.com/logo.png',
      video: 'https://cdn.example.com/demo.mp4',
    });
    expect(entries[0]?.priority).toBe('high');
    expect(entries[0]?.resourceLinks).toEqual([
      {
        label: 'Docs',
        url: 'https://example.com/docs',
      },
    ]);
  });

  it('accepts root-relative media asset paths for checked-in listing assets', () => {
    const entries = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        media: {
          images: ['/listing-logos/serpdownloaders.com/example-gallery-1.png'],
          logo: '/listing-logos/serpdownloaders.com/example-logo.png',
        },
      }),
    ]);

    expect(entries[0]?.media).toEqual({
      images: ['/listing-logos/serpdownloaders.com/example-gallery-1.png'],
      logo: '/listing-logos/serpdownloaders.com/example-logo.png',
    });
  });

  it('accepts entries that provide only categories and no top-level category', () => {
    const entries = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        category: undefined,
        categories: ['developer-tools', 'video-downloaders'],
      }),
    ]);

    expect(entries[0]?.category).toBeUndefined();
    expect(entries[0]?.categories).toEqual([
      'developer-tools',
      'video-downloaders',
    ]);
  });

  it('rejects entries without a website or domain', () => {
    expect(() =>
      parseJsonWebsiteEntries([
        buildWebsiteEntry({
          domain: undefined,
          website: undefined,
        }),
      ])
    ).toThrow('website or domain');
  });
});

describe('normalizeJsonWebsite', () => {
  it('normalizes alias fields, sanitizes the description, and keeps optional content', () => {
    const [entry] = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        category: 'integration-automation',
        categories: ['integration-automation', 'developer-tools'],
        content: '## Details\n\nRendered on the detail page.',
        description: '<p>Supports <strong>HTML</strong> descriptions.</p>',
        domain: 'https://example.com',
        entityType: 'person',
        media: {
          images: ['https://cdn.example.com/example-1.png'],
          logo: 'https://cdn.example.com/logo.png',
        },
        name: 'Example Project',
        resourceLinks: [
          {
            label: 'Support',
            url: 'https://example.com/support',
          },
        ],
        website: undefined,
      }),
    ]);

    const normalized = normalizeJsonWebsite(entry);

    expect(normalized.category).toBe('video-downloaders');
    expect(normalized.categories).toEqual([
      'video-downloaders',
      'developer-tools',
    ]);
    expect(normalized.content).toBe(
      '## Details\n\nRendered on the detail page.'
    );
    expect(normalized.description).toBe('Supports HTML descriptions.');
    expect(normalized.entityType).toBe('person');
    expect(normalized.media).toEqual({
      images: ['https://cdn.example.com/example-1.png'],
      logo: 'https://cdn.example.com/logo.png',
    });
    expect(normalized.resourceLinks).toEqual([
      {
        label: 'Support',
        url: 'https://example.com/support',
      },
    ]);
    expect(normalized.slug).toBe('example-project');
    expect(normalized.website).toBe('https://example.com');
  });

  it('preserves root-relative media asset paths during normalization', () => {
    const [entry] = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        media: {
          logo: '/listing-logos/serpdownloaders.com/example-logo.png',
        },
      }),
    ]);

    const normalized = normalizeJsonWebsite(entry);

    expect(normalized.media).toEqual({
      logo: '/listing-logos/serpdownloaders.com/example-logo.png',
    });
  });

  it('derives the canonical category from the first categories entry when category is omitted', () => {
    const [entry] = parseJsonWebsiteEntries([
      buildWebsiteEntry({
        category: undefined,
        categories: ['developer-tools', 'video-downloaders'],
      }),
    ]);

    const normalized = normalizeJsonWebsite(entry);

    expect(normalized.category).toBe('developer-tools');
    expect(normalized.categories).toEqual([
      'developer-tools',
      'video-downloaders',
    ]);
  });
});
