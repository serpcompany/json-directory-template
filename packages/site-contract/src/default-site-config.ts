import { DEFAULT_STARTER_APP_OUT_DIR, DEFAULT_STARTER_APP_PACKAGE_NAME } from './starter-app-defaults';
import type { CheckedInSiteConfig } from './types';

export const defaultSiteConfig: CheckedInSiteConfig = {
  branding: {},
  build: {
    appPackageName: DEFAULT_STARTER_APP_PACKAGE_NAME,
    appOutDir: DEFAULT_STARTER_APP_OUT_DIR,
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
    githubIssueOwner: 'example',
    githubIssueRepo: 'directory-starter',
    githubIssuesUrl:
      'https://github.com/example/directory-starter/issues/new/choose',
    githubRepoUrl: 'https://github.com/example/directory-starter',
    githubUrl: 'https://github.com/example',
    redditUrl: 'https://www.reddit.com/r/directorystarter/',
    twitterUrl: 'https://x.com/directorystarter',
  },
  version: 1,
};
