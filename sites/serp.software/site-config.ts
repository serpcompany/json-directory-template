import type { CheckedInSiteConfigOverride } from '../types'

export const serpSoftwareSiteConfig: CheckedInSiteConfigOverride = {
  analytics: {
    gtmId: 'GTM-W59GNHXF'
  },
  build: {
    appPackageName: 'serp.software',
    appOutDir: 'apps/serp.software/out',
    artifactDir: 'dist/sites/serp.software'
  },
  content: {
    listingSource: {
      category: 'video-downloaders',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.software/products.json',
      publishedAt: '2026-05-07'
    }
  },
  copy: {
    listingName: {
      plural: 'products',
      singular: 'product'
    },
    submitLabel: 'Submit a Product'
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serp.software.git',
    strategy: 'github-pages-repo-sync'
  },
  id: 'serp.software',
  networkBrandGroup: 'mainGroup',
  routes: {
    listingBasePath: 'products'
  },
  sitemap: {
    excludedPaths: ['/products']
  },
  site: {
    description: 'A searchable directory of downloader products from the SERP network.',
    domain: 'serp.software',
    name: 'SERP Software',
    publicUrl: 'https://serp.software',
    tagline: 'Downloader software in one searchable directory.'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'serp.software',
    githubIssuesUrl: 'https://github.com/serpcompany/serp.software/issues',
    githubRepoUrl: 'https://github.com/serpcompany',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/serpapps/',
    twitterUrl: 'https://x.com/serpapps'
  }
}
