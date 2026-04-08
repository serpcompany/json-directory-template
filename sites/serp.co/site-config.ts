import type { CheckedInSiteConfigOverride } from '../types';

export const serpCoSiteConfig: CheckedInSiteConfigOverride = {
  build: {
    artifactDir: 'dist/sites/serp.co',
  },
  copy: {
    listingName: {
      plural: 'products',
      singular: 'product',
    },
    submitLabel: 'Submit a Product',
  },
  content: {
    listingSource: {
      kind: 'listing-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.co/listings.json',
    },
  },
  id: 'serp.co',
  routes: {
    listingBasePath: 'products',
  },
  site: {
    description:
      'Discover and compare the best software companies in one place. Find the perfect solution for your business needs.',
    domain: 'serp.co',
    name: 'SERP',
    publicUrl: 'https://serp.co',
    tagline: 'Find your next SaaS',
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'contact',
    githubIssuesUrl: 'https://github.com/serpcompany/contact/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpcompany/contact',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/serpapps/',
    twitterUrl: 'https://x.com/serpcompany',
  },
};
