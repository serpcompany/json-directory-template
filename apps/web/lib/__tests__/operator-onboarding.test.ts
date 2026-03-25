import { defaultSiteConfig } from '../../../../sites/index';
import {
  buildOperatorOnboardingExport,
  createEmptyOperatorListing,
  operatorOnboardingDocumentSchema,
  operatorOnboardingFormSchema,
} from '@/lib/operator-onboarding';
import { buildOperatorOnboardingDocument } from '@/lib/operator-onboarding-server';

describe('operator onboarding helpers', () => {
  it('builds an operator document from checked-in site config and products', () => {
    const document = buildOperatorOnboardingDocument({
      products: {
        'example-listing': {
          content: {
            body: '## Overview\n\nExample body',
          },
          media: {
            logo: '/logo.png',
          },
          product: {
            categories: ['developer-tools', 'ai-ml'],
            productPage: 'https://example.com',
            slug: 'example-listing',
            tagline: 'Example tagline',
            title: 'Example Listing',
          },
          relatedLinks: [
            {
              label: 'Help Center',
              url: 'https://example.com/help',
            },
          ],
        },
      },
      siteConfig: defaultSiteConfig,
    });

    expect(document.site.siteId).toBe('default');
    expect(document.site.name).toBe('Directory Starter');
    expect(document.site.defaultCategory).toBe('developer-tools');
    expect(document.listings).toHaveLength(1);
    expect(document.listings[0]?.product.title).toBe('Example Listing');
    expect(document.listings[0]?.product.categories).toEqual([
      'developer-tools',
      'ai-ml',
    ]);
    expect(document.listings[0]?.relatedLinks).toEqual([
      {
        label: 'Help Center',
        url: 'https://example.com/help',
      },
    ]);
  });

  it('builds export payloads for site-config and products.json', () => {
    const exportPayload = buildOperatorOnboardingExport({
      listings: [
        {
          content: {
            body: '## Overview\n\nExample body',
          },
          media: {
            logo: '/logo.png',
          },
          product: {
            categories: ['video-downloaders'],
            productPage: 'https://serp.ly/example',
            slug: 'example-downloader',
            tagline: 'Example tagline',
            title: 'Example Downloader',
          },
          relatedLinks: [
            {
              label: 'Help Center',
              url: 'https://serp.ly/example/help',
            },
          ],
        },
      ],
      site: {
        defaultCategory: 'video-downloaders',
        description: 'Example description',
        docsLabel: 'Docs',
        docsRouteBasePath: 'docs',
        domain: 'serpdownloaders.com',
        featuredCount: 6,
        githubIssueOwner: 'serpcompany',
        githubIssueRepo: 'json-directory-template',
        githubIssuesUrl:
          'https://github.com/serpcompany/json-directory-template/issues/new/choose',
        githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
        githubUrl: 'https://github.com/serpcompany',
        listingPluralLabel: 'downloaders',
        listingRouteBasePath: 'listing',
        listingSingularLabel: 'downloader',
        name: 'SERP Downloaders',
        networkLabel: 'Network',
        networkRouteBasePath: 'network',
        publicUrl: 'https://serpdownloaders.com',
        publishedAt: '2026-03-25',
        redditUrl: 'https://www.reddit.com/r/serpdownloaders/',
        siteId: 'serpdownloaders.com',
        submitLabel: 'Submit a Downloader',
        tagline: 'Download anything',
        twitterUrl: 'https://x.com/serpapps',
      },
    });

    expect(exportPayload.siteConfig.id).toBe('serpdownloaders.com');
    expect(exportPayload.siteConfig.content.listingSource.path).toBe(
      'sites/serpdownloaders.com/products.json'
    );
    expect(exportPayload.siteConfig.content.listingSource.outputPath).toBe(
      'data/listings.json'
    );
    expect(exportPayload.siteConfig.build.artifactDir).toBe(
      'dist/sites/serpdownloaders.com'
    );
    expect(exportPayload.productsJson['example-downloader']).toEqual({
      content: {
        body: '## Overview\n\nExample body',
      },
      media: {
        logo: '/logo.png',
      },
      product: {
        categories: ['video-downloaders'],
        productPage: 'https://serp.ly/example',
        slug: 'example-downloader',
        tagline: 'Example tagline',
        title: 'Example Downloader',
      },
      relatedLinks: [
        {
          label: 'Help Center',
          url: 'https://serp.ly/example/help',
        },
      ],
    });
  });

  it('exposes a JSON schema with operator-editable site and listing sections', () => {
    expect(operatorOnboardingFormSchema.type).toBe('object');
    expect(operatorOnboardingFormSchema.properties).toMatchObject({
      listings: expect.any(Object),
      site: expect.any(Object),
    });
    const productProperties = (
      operatorOnboardingFormSchema.properties?.listings as {
        items?: {
          properties?: {
            product?: { properties?: Record<string, unknown> };
          };
        };
      }
    ).items?.properties?.product?.properties;

    expect(productProperties).toHaveProperty('categories');
    expect(productProperties).not.toHaveProperty('primaryCategory');
  });

  it('flags duplicate listing slugs before export', () => {
    const duplicateDocument = operatorOnboardingDocumentSchema.safeParse({
      listings: [
        {
          product: {
            categories: ['video-downloaders'],
            productPage: 'https://serp.ly/example-a',
            slug: 'duplicate-slug',
            tagline: 'Example tagline',
            title: 'Example A',
          },
        },
        {
          product: {
            categories: ['video-downloaders'],
            productPage: 'https://serp.ly/example-b',
            slug: 'duplicate-slug',
            tagline: 'Example tagline',
            title: 'Example B',
          },
        },
      ],
      site: {
        defaultCategory: 'video-downloaders',
        description: 'Example description',
        docsLabel: 'Docs',
        docsRouteBasePath: 'docs',
        domain: 'serpdownloaders.com',
        featuredCount: 6,
        githubIssueOwner: 'serpcompany',
        githubIssueRepo: 'json-directory-template',
        githubIssuesUrl:
          'https://github.com/serpcompany/json-directory-template/issues/new/choose',
        githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
        githubUrl: 'https://github.com/serpcompany',
        listingPluralLabel: 'downloaders',
        listingRouteBasePath: 'listing',
        listingSingularLabel: 'downloader',
        name: 'SERP Downloaders',
        networkLabel: 'Network',
        networkRouteBasePath: 'network',
        publicUrl: 'https://serpdownloaders.com',
        publishedAt: '2026-03-25',
        redditUrl: 'https://www.reddit.com/r/serpdownloaders/',
        siteId: 'serpdownloaders.com',
        submitLabel: 'Submit a Downloader',
        tagline: 'Download anything',
        twitterUrl: 'https://x.com/serpapps',
      },
    });

    expect(duplicateDocument.success).toBe(false);
    expect(duplicateDocument.error?.issues[0]?.message).toMatch(
      /duplicate listing slug/i
    );
  });

  it('creates a starter listing with the selected default category', () => {
    const starterListing = createEmptyOperatorListing('video-downloaders');

    expect(starterListing.product.categories).toEqual(['video-downloaders']);
    expect(starterListing.relatedLinks).toEqual([]);
  });
});
