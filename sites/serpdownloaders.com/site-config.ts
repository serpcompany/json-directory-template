import type { CheckedInSiteConfigOverride } from '../types';

export const serpdownloadersComSiteConfig: CheckedInSiteConfigOverride = {
  analytics: {
    gtmId: 'GTM-M82HC3SC',
  },
  branding: {
    favicon: {
      path: 'sites/serpdownloaders.com/assets/favicon.ico',
      source: 'local-path',
    },
    logo: {
      path: 'sites/serpdownloaders.com/assets/logo.png',
      source: 'local-path',
    },
    opengraphImage: {
      path: 'sites/serpdownloaders.com/assets/opengraph-image.png',
      source: 'local-path',
    },
  },
  build: {
    artifactDir: 'dist/sites/serpdownloaders.com',
  },
  content: {
    listingSource: {
      category: 'video-downloaders',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serpdownloaders.com/products.json',
      publishedAt: '2026-03-24',
    },
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
    repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
    strategy: 'github-pages-repo-sync',
  },
  id: 'serpdownloaders.com',
  routes: {
    listingBasePath: 'products',
  },
  site: {
    description: 'A collection of tools to help you download anything from anywhere, anytime.',
    domain: 'serpdownloaders.com',
    name: 'SERP Downloaders',
    publicUrl: 'https://serpdownloaders.com',
    tagline: 'For the people who just like to get down...loading',
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'json-directory-template',
    githubIssuesUrl:
      'https://github.com/serpcompany/json-directory-template/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
    githubUrl: 'https://github.com/serpdownloaders',
    redditUrl: 'https://www.reddit.com/r/serpdownloaders/',
    twitterUrl: 'https://x.com/serpapps',
  },
};
