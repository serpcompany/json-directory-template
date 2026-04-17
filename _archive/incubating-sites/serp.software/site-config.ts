import type { CheckedInSiteConfigOverride } from '../../../sites/types'

export const serpSoftwareSiteConfig: CheckedInSiteConfigOverride = {
  build: {
    artifactDir: 'dist/sites/serp.software'
  },
  copy: {
    listingName: {
      plural: 'software',
      singular: 'software'
    },
    submitLabel: 'Submit Software'
  },
  content: {
    listingSource: {
      kind: 'listing-json',
      outputPath: 'data/listings.json',
      path: 'data/listings.json'
    }
  },
  id: 'serp.software',
  routes: {
    listingBasePath: 'software'
  },
  site: {
    description: 'Discover curated software tools, products, and internet utilities across categories.',
    domain: 'serp.software',
    name: 'SERP Software',
    publicUrl: 'https://serp.software',
    tagline: 'Curated software directory'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'json-directory-template',
    githubIssuesUrl:
      'https://github.com/serpcompany/json-directory-template/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/serpapps/',
    twitterUrl: 'https://x.com/serpcompany'
  }
}
