import { ZodError } from 'zod';
import { describe, expect, it } from 'vitest';
import { defaultSiteConfig } from '../sites/site-config.default.ts';
import {
  buildSiteEnvironment,
  loadCheckedInSite,
  resolveResolvedSiteConfig,
  resolveSiteArtifactDir,
  validateCheckedInSiteConfig,
} from './site-config.ts';

function cloneDefaultSiteConfig() {
  return structuredClone(defaultSiteConfig);
}

describe('loadCheckedInSite', () => {
  it('loads the checked-in serpdownloaders.com site config', () => {
    const config = loadCheckedInSite('serpdownloaders.com');

    expect(config.id).toBe('serpdownloaders.com');
    expect(config.content.listingSource.kind).toBe('trial-products-json');
    expect(config.site.domain).toBe('serpdownloaders.com');
    expect(config.routes.listingBasePath).toBe('products');
    expect(config.routes.docsBasePath).toBe('docs');
    expect(config.routes.networkBasePath).toBe('network');
    expect(config.content.listingSource.outputPath).toBe('data/listings.json');
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'products',
        singular: 'product',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Product',
    });
    expect(config.features.showAuth).toBe(false);
    expect(config.features.showDocs).toBe(false);
    expect(config.features.showExternalResources).toBe(false);
    expect(config.features.showFavorites).toBe(false);
    expect(config.features.showGuides).toBe(false);
    expect(config.features.showNewsletter).toBe(true);
    expect(config.features.showProjects).toBe(false);
    expect(config.analytics?.gtmId).toBe('GTM-M82HC3SC');
    expect(config.deploy?.strategy).toBe('github-pages-repo-sync');
  });

  it('inherits default values when a site override does not redefine them', () => {
    const config = loadCheckedInSite('serpdownloaders.com');

    expect(config.social.githubIssueOwner).toBe('serpcompany');
    expect(config.social.githubIssueRepo).toBe('json-directory-template');
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.routes.listingBasePath).toBe('products');
    expect(config.routes.docsBasePath).toBe('docs');
    expect(config.routes.networkBasePath).toBe('network');
    expect(config.copy.submitLabel).toBe('Submit a Product');
    expect(config.copy.docsLabel).toBe('Docs');
    expect(config.copy.networkLabel).toBe('Network');
    expect(config.analytics?.gtmId).toBe('GTM-M82HC3SC');
    expect(config.features.showNewsletter).toBe(true);
  });

  it('loads the checked-in serp.software site config without a deploy target', () => {
    const config = loadCheckedInSite('serp.software');

    expect(config.id).toBe('serp.software');
    expect(config.content.listingSource.kind).toBe('listing-json');
    expect(config.site.domain).toBe('serp.software');
    expect(config.routes.listingBasePath).toBe('software');
    expect(config.content.listingSource.outputPath).toBe('data/listings.json');
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'software',
        singular: 'software',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit Software',
    });
    expect(config.analytics?.gtmId).toBeUndefined();
    expect(config.deploy).toBeUndefined();
  });

  it('loads the checked-in serp.co site config', () => {
    const config = loadCheckedInSite('serp.co');

    expect(config.id).toBe('serp.co');
    expect(config.content.listingSource.kind).toBe('listing-json');
    expect(config.site.domain).toBe('serp.co');
    expect(config.routes.listingBasePath).toBe('products');
    expect(config.content.listingSource.outputPath).toBe('data/listings.json');
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'products',
        singular: 'product',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Product',
    });
    expect(config.social.githubIssueRepo).toBe('contact');
    expect(config.social.githubRepoUrl).toBe(
      'https://github.com/serpcompany/contact'
    );
    expect(config.analytics?.gtmId).toBeUndefined();
    expect(config.deploy).toBeUndefined();
  });

  it('loads the checked-in default site config when no site id is provided', () => {
    const config = loadCheckedInSite();

    expect(config.id).toBe('default');
    expect(config.site.domain).toBe('example.com');
    expect(config.content.listingSource.kind).toBe('listing-json');
    expect(config.routes.listingBasePath).toBe('listing');
    expect(config.routes.docsBasePath).toBe('docs');
    expect(config.routes.networkBasePath).toBe('network');
    expect(config.analytics?.gtmId).toBeUndefined();
    expect(config.copy.listingName.singular).toBe('listing');
    expect(config.copy.docsLabel).toBe('Docs');
    expect(config.copy.networkLabel).toBe('Network');
  });
});

describe('validateCheckedInSiteConfig', () => {
  it('rejects duplicate public route base paths', () => {
    const invalidConfig = cloneDefaultSiteConfig();
    invalidConfig.routes.listingBasePath = invalidConfig.routes.docsBasePath;

    let error: unknown;

    try {
      validateCheckedInSiteConfig(invalidConfig);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ZodError);
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'routes.listingBasePath cannot reuse "docs" because routes.docsBasePath already uses it.',
          path: ['routes', 'listingBasePath'],
        }),
      ])
    );
  });

  it('rejects reserved public route base paths', () => {
    const invalidConfig = cloneDefaultSiteConfig();
    invalidConfig.routes.networkBasePath = 'tools';

    let error: unknown;

    try {
      validateCheckedInSiteConfig(invalidConfig);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ZodError);
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'routes.networkBasePath cannot use "tools". /tools is reserved for future first-party tool pages.',
          path: ['routes', 'networkBasePath'],
        }),
      ])
    );
  });

  it('rejects listing route base paths that collide with sitemap family names', () => {
    const reservedListingPaths = ['pages', 'sitemap'] as const;

    for (const listingBasePath of reservedListingPaths) {
      const invalidConfig = cloneDefaultSiteConfig();
      invalidConfig.routes.listingBasePath = listingBasePath;

      let error: unknown;

      try {
        validateCheckedInSiteConfig(invalidConfig);
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(ZodError);
      expect((error as ZodError).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['routes', 'listingBasePath'],
          }),
        ])
      );
    }
  });

  it('rejects invalid GTM container ids', () => {
    const invalidConfig = cloneDefaultSiteConfig();
    invalidConfig.analytics = {
      gtmId: 'UA-INVALID',
    };

    let error: unknown;

    try {
      validateCheckedInSiteConfig(invalidConfig);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ZodError);
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['analytics', 'gtmId'],
        }),
      ])
    );
  });
});

describe('resolveSiteArtifactDir', () => {
  it('resolves the configured artifact directory', () => {
    expect(
      resolveSiteArtifactDir(loadCheckedInSite('serpdownloaders.com'))
    ).toBe('dist/sites/serpdownloaders.com');
    expect(resolveSiteArtifactDir(loadCheckedInSite('serp.software'))).toBe(
      'dist/sites/serp.software'
    );
  });
});

describe('buildSiteEnvironment', () => {
  it('maps a checked-in site config to the minimal app env contract', () => {
    expect(
      buildSiteEnvironment(loadCheckedInSite('serpdownloaders.com'))
    ).toEqual({
      LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_SITE_ID: 'serpdownloaders.com',
      SITE_ID: 'serpdownloaders.com',
    });
    expect(buildSiteEnvironment(loadCheckedInSite('serp.software'))).toEqual({
      LISTING_ROUTE_BASE_PATH: 'software',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'software',
      NEXT_PUBLIC_SITE_ID: 'serp.software',
      SITE_ID: 'serp.software',
    });
    expect(buildSiteEnvironment(loadCheckedInSite('serp.co'))).toEqual({
      LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_SITE_ID: 'serp.co',
      SITE_ID: 'serp.co',
    });
  });
});

describe('resolveResolvedSiteConfig', () => {
  it('resolves the checked-in site config into the app-facing shape', () => {
    expect(
      resolveResolvedSiteConfig(loadCheckedInSite('serpdownloaders.com'))
    ).toMatchObject({
      copy: {
        listingName: {
          plural: 'products',
          singular: 'product',
        },
        submitLabel: 'Submit a Product',
      },
      description:
        'A collection of tools to help you download anything from anywhere, anytime.',
      domain: 'serpdownloaders.com',
      gtmId: 'GTM-M82HC3SC',
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'json-directory-template',
      id: 'serpdownloaders.com',
      docsRouteBasePath: 'docs',
      listingRouteBasePath: 'products',
      name: 'SERP Downloaders',
      networkRouteBasePath: 'network',
      publicUrl: 'https://serpdownloaders.com',
      tagline: 'For the people who just like to get down...loading',
    });
  });

  it('resolves serp.software into the app-facing site-config shape', () => {
    expect(resolveResolvedSiteConfig(loadCheckedInSite('serp.software'))).toMatchObject({
      copy: {
        listingName: {
          plural: 'software',
          singular: 'software',
        },
        submitLabel: 'Submit Software',
      },
      description:
        'Discover curated software tools, products, and internet utilities across categories.',
      domain: 'serp.software',
      gtmId: undefined,
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'json-directory-template',
      id: 'serp.software',
      docsRouteBasePath: 'docs',
      listingRouteBasePath: 'software',
      name: 'SERP Software',
      networkRouteBasePath: 'network',
      publicUrl: 'https://serp.software',
      tagline: 'Curated software directory',
    });
  });

  it('resolves serp.co into the app-facing site-config shape', () => {
    expect(resolveResolvedSiteConfig(loadCheckedInSite('serp.co'))).toMatchObject({
      copy: {
        listingName: {
          plural: 'products',
          singular: 'product',
        },
        submitLabel: 'Submit a Product',
      },
      description:
        'Discover and compare the best software companies in one place. Find the perfect solution for your business needs.',
      domain: 'serp.co',
      gtmId: undefined,
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'contact',
      id: 'serp.co',
      docsRouteBasePath: 'docs',
      listingRouteBasePath: 'products',
      name: 'SERP',
      networkRouteBasePath: 'network',
      publicUrl: 'https://serp.co',
      tagline: 'Find your next SaaS',
    });
  });
});
