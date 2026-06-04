import type { CheckedInSiteConfigOverride } from '../types'

export const serpCoSiteConfig: CheckedInSiteConfigOverride = {
  analytics: {
    gtmId: 'GTM-W59GNHXF'
  },
  badges: {
    featuredOn: {
      dark: 'badge/featured-on-serp-co-dark.svg',
      light: 'badge/featured-on-serp-co-light.svg'
    }
  },
  branding: {
    favicon: {
      path: 'sites/serp.co/assets/favicon.ico',
      source: 'local-path'
    },
    logo: {
      path: 'sites/serp.co/assets/logo.png',
      source: 'local-path'
    },
    opengraphImage: {
      path: 'sites/serp.co/assets/opengraph-image.png',
      source: 'local-path'
    }
  },
  build: {
    appPackageName: 'serp.co',
    appOutDir: 'apps/serp.co/out',
    artifactDir: 'dist/sites/serp.co'
  },
  content: {
    listingSource: {
      category: 'other',
      featuredCount: 12,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.co/products.json',
      publishedAt: '2026-05-16'
    }
  },
  copy: {
    listingName: {
      plural: 'products',
      singular: 'product'
    },
    submitLabel: 'Submit'
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serp.co.git',
    strategy: 'github-pages-repo-sync'
  },
  id: 'serp.co',
  networkBrandGroup: 'all',
  features: {
    showBrands: true,
    showGuides: true
  },
  routes: {
    listingBasePath: 'products'
  },
  sitemap: {
    categoryBasePath: 'products/best',
    artifactExcludedPaths: [],
    excludedPaths: ['/products/best/featured', '/products/best/other'],
    listingDetailSuffix: 'reviews',
    pathByGroup: {
      listings: '/sitemaps/directory/1.xml',
      pages: '/sitemaps/pages/1.xml',
      posts: '/sitemaps/blog/1.xml',
      taxonomies: '/sitemaps/categories/1.xml'
    },
    staticPagePaths: [
      '/',
      '/about',
      '/brands',
      '/contact',
      '/legal',
      '/legal/affiliate-disclosure',
      '/legal/dmca',
      '/legal/privacy-policy',
      '/legal/terms-conditions',
      '/posts',
      '/pricing',
      '/sponsor',
      '/submit'
    ]
  },
  site: {
    description:
      'SERP helps people discover software, AI tools, companies, resources, and projects from the SERP network.',
    domain: 'serp.co',
    name: 'SERP',
    publicUrl: 'https://serp.co',
    tagline: 'Software, AI tools, companies, resources, and SERP projects'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'serp.co',
    githubIssuesUrl: 'https://github.com/serpcompany/serp.co/issues',
    githubRepoUrl: 'https://github.com/serpcompany',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/serpapps/',
    twitterUrl: 'https://x.com/serpdotco'
  }
}
