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
  it('loads the checked-in SERP Extensions site config', () => {
    const config = loadCheckedInSite('extensions.serp.co');

    expect(config.id).toBe('extensions.serp.co');
    expect(config.content.listingSource.kind).toBe('listing-json');
    expect(config.site.domain).toBe('extensions.serp.co');
    expect(config.routes.listingBasePath).toBe('extension');
    expect(config.content.listingSource.outputPath).toBe('data/listings.json');
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'extensions',
        singular: 'extension',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit an Extension',
    });
    expect(config.features.showNewsletter).toBe(false);
    expect(config.social.githubRepoUrl).toBe(
      'https://github.com/serpcompany/extensions.serp.co'
    );
    expect(config.deploy?.repoUrl).toBe(
      'https://github.com/serpcompany/extensions.serp.co.git'
    );
  });

  it('loads the checked-in serpdownloaders.com site config', () => {
    const config = loadCheckedInSite('serpdownloaders.com');

    expect(config.id).toBe('serpdownloaders.com');
    expect(config.content.listingSource.kind).toBe('trial-products-json');
    expect(config.site.domain).toBe('serpdownloaders.com');
    expect(config.routes.listingBasePath).toBe('listing');
    expect(config.routes.docsBasePath).toBe('docs');
    expect(config.routes.networkBasePath).toBe('network');
    expect(config.content.listingSource.outputPath).toBe('data/listings.json');
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'listings',
        singular: 'listing',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Listing',
    });
    expect(config.features.showAuth).toBe(false);
    expect(config.features.showDocs).toBe(false);
    expect(config.features.showExternalResources).toBe(false);
    expect(config.features.showFavorites).toBe(false);
    expect(config.features.showGuides).toBe(false);
    expect(config.features.showNewsletter).toBe(true);
    expect(config.features.showProjects).toBe(false);
    expect(config.deploy?.strategy).toBe('github-pages-repo-sync');
  });

  it('inherits default values when a site override does not redefine them', () => {
    const config = loadCheckedInSite('serpdownloaders.com');

    expect(config.social.githubIssueOwner).toBe('serpcompany');
    expect(config.social.githubIssueRepo).toBe('json-directory-template');
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.routes.listingBasePath).toBe('listing');
    expect(config.routes.docsBasePath).toBe('docs');
    expect(config.routes.networkBasePath).toBe('network');
    expect(config.copy.submitLabel).toBe('Submit a Listing');
    expect(config.copy.docsLabel).toBe('Docs');
    expect(config.copy.networkLabel).toBe('Network');
    expect(config.features.showNewsletter).toBe(true);
  });

  it('loads the checked-in default site config when no site id is provided', () => {
    const config = loadCheckedInSite();

    expect(config.id).toBe('default');
    expect(config.site.domain).toBe('example.com');
    expect(config.content.listingSource.kind).toBe('listing-json');
    expect(config.routes.listingBasePath).toBe('listing');
    expect(config.routes.docsBasePath).toBe('docs');
    expect(config.routes.networkBasePath).toBe('network');
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
});

describe('resolveSiteArtifactDir', () => {
  it('resolves the configured artifact directory', () => {
    expect(
      resolveSiteArtifactDir(loadCheckedInSite('serpdownloaders.com'))
    ).toBe('dist/sites/serpdownloaders.com');
  });
});

describe('buildSiteEnvironment', () => {
  it('maps a checked-in site config to the minimal app env contract', () => {
    expect(
      buildSiteEnvironment(loadCheckedInSite('serpdownloaders.com'))
    ).toEqual({
      LISTING_ROUTE_BASE_PATH: 'listing',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'listing',
      NEXT_PUBLIC_SITE_ID: 'serpdownloaders.com',
      SITE_ID: 'serpdownloaders.com',
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
          plural: 'listings',
          singular: 'listing',
        },
        submitLabel: 'Submit a Listing',
      },
      description:
        'A collection of tools to help you download anything from anywhere, anytime.',
      domain: 'serpdownloaders.com',
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'json-directory-template',
      id: 'serpdownloaders.com',
      docsRouteBasePath: 'docs',
      listingRouteBasePath: 'listing',
      name: 'SERP Downloaders',
      networkRouteBasePath: 'network',
      publicUrl: 'https://serpdownloaders.com',
      tagline: 'For the people who just like to get down...loading',
    });
  });
});
