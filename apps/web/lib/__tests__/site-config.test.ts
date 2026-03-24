import { resolveSiteConfig } from '@/lib/site-config';

describe('resolveSiteConfig', () => {
  it('loads the checked-in per-site config for SERP Extensions', () => {
    const config = resolveSiteConfig('serpextensions');

    expect(config.id).toBe('serpextensions');
    expect(config.name).toBe('SERP Extensions');
    expect(config.domain).toBe('extensions.serp.co');
    expect(config.description).toBe(
      'Discover curated browser extensions for productivity, privacy, accessibility, and beyond.'
    );
    expect(config.githubIssueRepo).toBe('extensions.serp.co');
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/extensions.serp.co/issues/new/choose'
    );
    expect(config.githubRepoUrl).toBe(
      'https://github.com/serpcompany/extensions.serp.co'
    );
    expect(config.publicUrl).toBe('https://extensions.serp.co');
    expect(config.listingRouteBasePath).toBe('extension');
    expect(config.copy).toEqual({
      docsLabel: 'Docs',
      listingName: {
        plural: 'extensions',
        singular: 'extension',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit an Extension',
    });
    expect(config.features.showNewsletter).toBe(false);
  });

  it('loads the checked-in per-site config for serpdownloaders', () => {
    const config = resolveSiteConfig('serpdownloaders');

    expect(config.name).toBe('SERP Downloaders');
    expect(config.domain).toBe('serpdownloaders.com');
    expect(config.description).toBe(
      'Directory of download-focused browser tools.'
    );
    expect(config.githubIssueOwner).toBe('serpcompany');
    expect(config.githubIssueRepo).toBe('json-directory-template');
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.publicUrl).toBe('https://serpdownloaders.com');
    expect(config.listingRouteBasePath).toBe('listing');
    expect(config.docsRouteBasePath).toBe('docs');
    expect(config.networkRouteBasePath).toBe('network');
    expect(config.copy).toEqual({
      docsLabel: 'Docs',
      listingName: {
        plural: 'listings',
        singular: 'listing',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Listing',
    });
    expect(config.features).toEqual({
      showAuth: false,
      showCreatorProjects: false,
      showDocs: false,
      showExternalResources: false,
      showFavorites: false,
      showFeaturedGuides: false,
      showGuides: false,
      showNewsletter: true,
      showProjects: false,
    });
  });

  it('inherits default social and route values for sparse site overrides', () => {
    const config = resolveSiteConfig('serpdownloaders');

    expect(config.githubIssueOwner).toBe('serpcompany');
    expect(config.githubIssueRepo).toBe('json-directory-template');
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.listingRouteBasePath).toBe('listing');
    expect(config.docsRouteBasePath).toBe('docs');
    expect(config.networkRouteBasePath).toBe('network');
    expect(config.copy.docsLabel).toBe('Docs');
    expect(config.copy.networkLabel).toBe('Network');
    expect(config.copy.submitLabel).toBe('Submit a Listing');
  });

  it('falls back to the checked-in default site config', () => {
    const config = resolveSiteConfig('unknown-site');

    expect(config.id).toBe('default');
    expect(config.name).toBe('Directory Starter');
    expect(config.domain).toBe('example.com');
    expect(config.listingRouteBasePath).toBe('listing');
    expect(config.docsRouteBasePath).toBe('docs');
    expect(config.networkRouteBasePath).toBe('network');
    expect(config.copy).toEqual({
      docsLabel: 'Docs',
      listingName: {
        plural: 'listings',
        singular: 'listing',
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Listing',
    });
  });
});
