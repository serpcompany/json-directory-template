import type { CheckedInSiteConfigOverride } from '../types';

export const serpdownloadersComSiteConfig: CheckedInSiteConfigOverride = {
  branding: {
    drBadge: {
      alt: 'Verified DR badge for serpdownloaders.com',
      height: 50,
      href: 'https://dr.serp.co/',
      imageSrc: 'https://dr.serp.co/badge/serpdownloaders.com?style=serp-dr-v3',
      width: 200,
    },
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
      category: 'automation-workflow',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serpdownloaders.com/products.json',
      publishedAt: '2026-03-24',
    },
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
    strategy: 'github-pages-repo-sync',
  },
  id: 'serpdownloaders.com',
  site: {
    description: 'A collection of tools to help you download anything from anywhere, anytime.',
    domain: 'serpdownloaders.com',
    name: 'SERP Downloaders',
    publicUrl: 'https://serpdownloaders.com',
    tagline: 'For the people who just like to get down...loading',
  },
  social: {
    redditUrl: 'https://www.reddit.com/r/serp/',
    twitterUrl: 'https://x.com/serpcompany',
  },
};
