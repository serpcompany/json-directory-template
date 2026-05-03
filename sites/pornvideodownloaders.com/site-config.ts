import type { CheckedInSiteConfigOverride } from '../types';

export const pornvideodownloadersComSiteConfig: CheckedInSiteConfigOverride = {
  branding: {
    favicon: {
      path: 'sites/pornvideodownloaders.com/assets/favicon.ico',
      source: 'local-path',
    },
    logo: {
      path: 'sites/pornvideodownloaders.com/assets/logo.png',
      source: 'local-path',
    },
    opengraphImage: {
      path: 'sites/pornvideodownloaders.com/assets/opengraph-image.png',
      source: 'local-path',
    },
  },
  build: {
    appPackageName: 'pornvideodownloaders.com',
    appOutDir: 'apps/pornvideodownloaders.com/out',
    artifactDir: 'dist/sites/pornvideodownloaders.com',
  },
  content: {
    listingSource: {
      category: 'video-downloaders',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/pornvideodownloaders.com/products.json',
      publishedAt: '2026-05-03',
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
    repoUrl: 'https://github.com/serpcompany/pornvideodownloaders.com.git',
    strategy: 'github-pages-repo-sync',
  },
  id: 'pornvideodownloaders.com',
  routes: {
    listingBasePath: 'products',
  },
  site: {
    description: 'Downloaders for adult video platforms and creator sites.',
    domain: 'pornvideodownloaders.com',
    name: 'Porn Video Downloaders',
    publicUrl: 'https://pornvideodownloaders.com',
    tagline: 'Adult video downloader tools in one searchable directory.',
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'json-directory-template',
    githubIssuesUrl:
      'https://github.com/serpcompany/json-directory-template/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpxxx',
    githubUrl: 'https://github.com/serpdownloaders',
    redditUrl: 'https://www.reddit.com/r/serpxxx/',
    twitterUrl: 'https://x.com/serpapps',
  },
};
