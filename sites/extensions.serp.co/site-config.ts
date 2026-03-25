import type { CheckedInSiteConfigOverride } from '../types';

export const extensionsSerpCoSiteConfig: CheckedInSiteConfigOverride = {
  build: {
    artifactDir: 'dist/sites/extensions.serp.co',
  },
  content: {
    listingSource: {
      kind: 'listing-json',
      outputPath: 'data/listings.json',
      path: 'data/listings.json',
    },
  },
  copy: {
    listingName: {
      plural: 'extensions',
      singular: 'extension',
    },
    submitLabel: 'Submit an Extension',
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/extensions.serp.co.git',
    strategy: 'github-pages-repo-sync',
  },
  features: {
    showNewsletter: false,
  },
  id: 'extensions.serp.co',
  routes: {
    listingBasePath: 'extension',
  },
  site: {
    description:
      'Discover curated browser extensions for productivity, privacy, accessibility, and beyond.',
    domain: 'extensions.serp.co',
    name: 'SERP Extensions',
    publicUrl: 'https://extensions.serp.co',
    tagline: 'Curated browser extension directory',
  },
  social: {
    githubIssueRepo: 'extensions.serp.co',
    githubIssuesUrl:
      'https://github.com/serpcompany/extensions.serp.co/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpcompany/extensions.serp.co',
    twitterUrl: 'https://x.com/serpcompany',
  },
};
