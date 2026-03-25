import type { CheckedInSiteConfig } from './types';

export const defaultSiteConfig: CheckedInSiteConfig = {
  branding: {},
  build: {
    appOutDir: 'apps/web/out',
    artifactDir: 'dist/sites/default',
    mode: 'static-directory',
  },
  copy: {
    categoryLabels: {},
    docsLabel: 'Docs',
    listingName: {
      plural: 'listings',
      singular: 'listing',
    },
    networkLabel: 'Network',
    submitLabel: 'Submit a Listing',
  },
  content: {
    listingSource: {
      kind: 'listing-json',
      outputPath: 'data/listings.json',
      path: 'data/listings.json',
    },
  },
  features: {
    showAuth: false,
    showCreatorProjects: false,
    showDocs: false,
    showExternalResources: false,
    showFavorites: false,
    showFeaturedGuides: false,
    showGuides: false,
    showNewsletter: true,
    showProjects: false,
  },
  id: 'default',
  routes: {
    docsBasePath: 'docs',
    listingBasePath: 'listing',
    networkBasePath: 'network',
  },
  site: {
    description: 'Curated directory of listings and resources.',
    domain: 'example.com',
    name: 'Directory Starter',
    publicUrl: 'https://example.com',
    tagline: 'Discover listings and resources',
  },
  social: {
    githubIssueOwner: 'serpapps',
    githubIssueRepo: 'support',
    githubIssuesUrl:
      'https://github.com/serpapps/support/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpapps/support',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/serpapps/',
    twitterUrl: 'https://x.com/serpcompany',
  },
  version: 1,
};
