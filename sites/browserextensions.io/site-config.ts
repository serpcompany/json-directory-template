import type { CheckedInSiteConfigOverride } from '../types'

export const browserextensionsIoSiteConfig: CheckedInSiteConfigOverride = {
  badges: {
    featuredOn: {
      dark: 'badge/featured-on-browserextensions.io-dark.svg',
      light: 'badge/featured-on-browserextensions.io-light.svg'
    }
  },
  branding: {
    favicon: {
      path: 'sites/browserextensions.io/assets/favicon.ico',
      source: 'local-path'
    },
    logo: {
      path: 'sites/browserextensions.io/assets/logo.png',
      source: 'local-path'
    },
    opengraphImage: {
      path: 'sites/browserextensions.io/assets/opengraph-image.png',
      source: 'local-path'
    }
  },
  build: {
    appPackageName: 'browserextensions.io',
    appOutDir: 'apps/browserextensions.io/out',
    artifactDir: 'dist/sites/browserextensions.io'
  },
  analytics: {
    gtmId: 'GTM-NL242383'
  },
  content: {
    listingSource: {
      category: 'video-downloaders',
      featuredCount: 0,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/browserextensions.io/products.json',
      publishedAt: '2026-05-16'
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
    repoUrl: 'https://github.com/serpcompany/browserextensions.io.git',
    strategy: 'github-pages-repo-sync'
  },
  id: 'browserextensions.io',
  networkBrandGroup: 'all',
  features: {
    showBrands: true
  },
  routes: {
    listingBasePath: 'products'
  },
  sitemap: {
    additionalPathsByGroup: {
      taxonomies: [
        '/categories/course-platforms',
        '/categories/image-downloader',
        '/categories/image-hosting',
        '/categories/livestream',
        '/categories/movies-and-tv',
        '/categories/social-media'
      ]
    },
    artifactExcludedPaths: ['/legal/privacy', '/legal/terms'],
    excludedPaths: ['/legal/privacy', '/legal/terms', '/products', '/search'],
    pathByGroup: {
      listings: '/sitemaps/directory/1.xml',
      pages: '/sitemaps/pages/1.xml',
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
      'Discover the best browser extensions for productivity, privacy, shopping, development, and more. Curated listings with ratings, pricing, and launch-friendly submission flow.',
    domain: 'browserextensions.io',
    name: 'BrowserExtensions.io',
    publicUrl: 'https://browserextensions.io',
    tagline: 'Discover the best browser extensions'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'browserextensions.io',
    githubIssuesUrl: 'https://github.com/serpcompany/browserextensions.io/issues',
    githubRepoUrl: 'https://github.com/serpcompany',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/BrowserExtensionsIO/',
    twitterUrl: 'https://x.com/serpcompany'
  }
}
