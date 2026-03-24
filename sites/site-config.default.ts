import type { CheckedInSiteConfig } from './types'

export const defaultSiteConfig: CheckedInSiteConfig = {
  branding: {
    drBadge: {
      domain: 'example.com',
      provider: 'serp-dr',
      style: 'serp-dr-v3'
    }
  },
  build: {
    appOutDir: 'apps/web/out',
    artifactDir: 'dist/sites/default',
    mode: 'static-directory'
  },
  copy: {
    docsLabel: 'Docs',
    listingName: {
      plural: 'listings',
      singular: 'listing'
    },
    networkLabel: 'Network',
    submitLabel: 'Submit a Listing'
  },
  content: {
    listingSource: {
      kind: 'listing-json',
      outputPath: 'data/websites.json',
      path: 'data/websites.json'
    }
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
    showProjects: false
  },
  id: 'default',
  routes: {
    docsBasePath: 'docs',
    listingBasePath: 'websites',
    networkBasePath: 'network'
  },
  site: {
    description: 'Curated directory of listings and resources.',
    domain: 'example.com',
    name: 'Directory Starter',
    publicUrl: 'https://example.com',
    tagline: 'Discover listings and resources'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'json-directory-template',
    githubIssueTemplate: 'submit-website.yml',
    githubIssuesUrl: 'https://github.com/serpcompany/json-directory-template/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/webdev/',
    twitterUrl: 'https://x.com/serpcompany'
  },
  version: 1
}
