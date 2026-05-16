import type { CheckedInSiteConfigOverride } from '../types';

export const serpAiSiteConfig: CheckedInSiteConfigOverride = {
  branding: {
    favicon: {
      path: 'sites/serp.ai/assets/favicon.ico',
      source: 'local-path',
    },
    logo: {
      path: 'sites/serp.ai/assets/logo.png',
      source: 'local-path',
    },
    opengraphImage: {
      path: 'sites/serp.ai/assets/opengraph-image.png',
      source: 'local-path',
    },
  },
  build: {
    appPackageName: 'serp.ai',
    appOutDir: 'apps/serp.ai/out',
    artifactDir: 'dist/sites/serp.ai',
  },
  content: {
    listingSource: {
      category: 'video-downloaders',
      featuredCount: 0,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.ai/products.json',
      publishedAt: '2026-05-16',
    },
  },
  copy: {
    categoryLabels: {
      adult: 'Adult',
      'course-platform-downloaders': 'Course Platform Downloaders',
      'fansite-downloaders': 'Fansite Downloaders',
      'gif-downloaders': 'GIF Downloaders',
      'image-downloaders': 'Image Downloaders',
      'livestream-downloaders': 'Livestream Downloaders',
      'movies-and-tv-downloaders': 'Movies & TV Downloaders',
      'social-media-downloaders': 'Social Media Downloaders',
      'video-downloaders': 'Video Downloaders',
    },
    listingName: {
      plural: 'products',
      singular: 'product',
    },
    submitLabel: 'Submit to SERP AI',
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serp.ai.git',
    strategy: 'github-pages-repo-sync',
  },
  id: 'serp.ai',
  networkBrandGroup: 'mainGroup',
  features: {
    showBrands: true,
  },
  routes: {
    listingBasePath: 'products',
  },
  sitemap: {
    additionalPathsByGroup: {
      taxonomies: [
        '/products/best/course-platforms',
        '/products/best/image-downloader',
        '/products/best/image-hosting',
        '/products/best/livestream',
        '/products/best/movies-tv',
        '/products/best/social-media',
      ],
    },
    artifactExcludedPaths: [
      '/categories/featured',
      '/legal/cookies',
      '/legal/privacy',
      '/legal/terms',
    ],
    categoryBasePath: 'products/best',
    excludedPaths: [
      '/categories/featured',
      '/legal/cookies',
      '/legal/privacy',
      '/legal/terms',
      '/products',
      '/search',
    ],
    indexGroupOrder: ['pages', 'taxonomies', 'listings'],
    listingDetailSuffix: 'reviews',
    pathByGroup: {
      listings: '/sitemaps/directory/1.xml',
      pages: '/sitemaps/pages/1.xml',
      taxonomies: '/sitemaps/categories/1.xml',
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
      '/submit',
    ],
  },
  site: {
    description:
      'SERP AI helps people discover AI tools, companies, models, datasets, news, and resources.',
    domain: 'serp.ai',
    name: 'SERP AI',
    publicUrl: 'https://serp.ai',
    tagline: 'AI tools, companies, models, datasets, news, and resources',
  },
  social: {
    githubIssueOwner: null,
    githubIssueRepo: null,
    githubIssuesUrl: null,
    githubRepoUrl: 'https://github.com/serp-ai',
    githubUrl: 'https://github.com/serp-ai',
    redditUrl: 'https://www.reddit.com/r/serpdotai/',
    twitterUrl: 'https://x.com/serpdotai',
  },
};
