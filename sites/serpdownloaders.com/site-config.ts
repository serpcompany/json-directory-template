import type { CheckedInSiteConfigOverride } from '../types'

export const serpdownloadersComSiteConfig: CheckedInSiteConfigOverride = {
  analytics: {
    gtmId: 'GTM-M82HC3SC'
  },
  badges: {
    featuredOn: {
      dark: 'badge/featured-on-serpdownloaders.com-dark.svg',
      light: 'badge/featured-on-serpdownloaders.com-light.svg'
    }
  },
  branding: {
    favicon: {
      path: 'sites/serpdownloaders.com/assets/favicon.ico',
      source: 'local-path'
    },
    logo: {
      path: 'sites/serpdownloaders.com/assets/logo.png',
      source: 'local-path'
    },
    opengraphImage: {
      path: 'sites/serpdownloaders.com/assets/opengraph-image.png',
      source: 'local-path'
    }
  },
  build: {
    appPackageName: 'serpdownloaders.com',
    appOutDir: 'apps/serpdownloaders.com/out',
    artifactDir: 'dist/sites/serpdownloaders.com'
  },
  content: {
    listingSource: {
      category: 'video-downloaders',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serpdownloaders.com/products.json',
      publishedAt: '2026-03-24'
    }
  },
  copy: {
    listingName: {
      plural: 'products',
      singular: 'product'
    },
    submitLabel: 'Submit Yours'
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
    strategy: 'github-pages-repo-sync'
  },
  id: 'serpdownloaders.com',
  networkBrandGroup: 'all',
  features: {
    showBrands: true
  },
  routes: {
    listingBasePath: 'products'
  },
  sitemap: {
    excludedPaths: ['/products']
  },
  site: {
    description:
      'Browser extensions that save videos from YouTube, TikTok, Udemy, Vimeo and hundreds of other sites for offline viewing.',
    domain: 'serpdownloaders.com',
    name: 'SERP Downloaders',
    publicUrl: 'https://serpdownloaders.com',
    tagline: 'Find a video downloader browser extension for the sites you use'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'serpdownloaders.com',
    githubIssuesUrl: 'https://github.com/serpcompany/serpdownloaders.com/issues',
    githubRepoUrl: 'https://github.com/serpapps',
    githubUrl: 'https://github.com/serpapps',
    redditUrl: 'https://www.reddit.com/r/serpdownloaders/',
    twitterUrl: 'https://x.com/serpdownloaders'
  }
}
