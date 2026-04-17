import type { CheckedInSiteConfigOverride } from '../../../sites/types';

export const serpCoSiteConfig: CheckedInSiteConfigOverride = {
  branding: {
    favicon: {
      path: '_archive/incubating-sites/serp.co/assets/favicon.ico',
      source: 'local-path',
    },
    logo: {
      path: '_archive/incubating-sites/serp.co/assets/logo.png',
      source: 'local-path',
    },
    opengraphImage: {
      path: '_archive/incubating-sites/serp.co/assets/opengraph-image.png',
      source: 'local-path',
    },
  },
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
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/staging.serp.co.git',
    strategy: 'github-pages-repo-sync',
  },
  content: {
    listingSource: {
      kind: 'listing-json',
      outputPath: 'data/listings.json',
      path: '_archive/incubating-sites/serp.co/listings.json',
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
