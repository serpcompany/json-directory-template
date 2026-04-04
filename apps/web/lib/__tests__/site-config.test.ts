import { resolveSiteConfig } from '@/lib/site-config';

describe('resolveSiteConfig', () => {
  it('loads the checked-in per-site config for serpdownloaders.com', () => {
    const config = resolveSiteConfig('serpdownloaders.com');

    expect(config.name).toBe('SERP Downloaders');
    expect(config.domain).toBe('serpdownloaders.com');
    expect(config.description).toBe(
      'A collection of tools to help you download anything from anywhere, anytime.'
    );
    expect(config.githubIssueOwner).toBe('serpcompany');
    expect(config.githubIssueRepo).toBe('json-directory-template');
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.publicUrl).toBe('https://serpdownloaders.com');
    expect(config.gtmId).toBe('GTM-M82HC3SC');
    expect(config.listingRouteBasePath).toBe('products');
    expect(config.docsRouteBasePath).toBe('docs');
    expect(config.networkRouteBasePath).toBe('network');
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

  it('loads the checked-in per-site config for serp.software', () => {
    const config = resolveSiteConfig('serp.software');

    expect(config.id).toBe('serp.software');
    expect(config.name).toBe('SERP Software');
    expect(config.domain).toBe('serp.software');
    expect(config.description).toBe(
      'Discover curated software tools, products, and internet utilities across categories.'
    );
    expect(config.githubIssueOwner).toBe('serpcompany');
    expect(config.githubIssueRepo).toBe('json-directory-template');
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.githubRepoUrl).toBe(
      'https://github.com/serpcompany/json-directory-template'
    );
    expect(config.publicUrl).toBe('https://serp.software');
    expect(config.gtmId).toBeUndefined();
    expect(config.listingRouteBasePath).toBe('software');
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
    const config = resolveSiteConfig('serpdownloaders.com');

    expect(config.githubIssueOwner).toBe('serpcompany');
    expect(config.githubIssueRepo).toBe('json-directory-template');
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    );
    expect(config.listingRouteBasePath).toBe('products');
    expect(config.docsRouteBasePath).toBe('docs');
    expect(config.networkRouteBasePath).toBe('network');
    expect(config.copy.docsLabel).toBe('Docs');
    expect(config.copy.networkLabel).toBe('Network');
    expect(config.copy.submitLabel).toBe('Submit a Product');
  });

  it('falls back to the checked-in default site config', () => {
    const config = resolveSiteConfig('unknown-site');

    expect(config.id).toBe('default');
    expect(config.name).toBe('Directory Starter');
    expect(config.domain).toBe('example.com');
    expect(config.gtmId).toBeUndefined();
    expect(config.listingRouteBasePath).toBe('listing');
    expect(config.docsRouteBasePath).toBe('docs');
    expect(config.networkRouteBasePath).toBe('network');
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
  });

  it('rejects removed checked-in site ids explicitly', () => {
    expect(() => resolveSiteConfig('extensions.serp.co')).toThrow(
      'Site "extensions.serp.co" was removed from this repo. Use a supported checked-in site id instead.'
    );
  });
});
