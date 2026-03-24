import { defaultSiteConfig } from '../site-config.default'
import type { CheckedInSiteConfig } from '../types'

export const serpdownloadersSiteConfig: CheckedInSiteConfig = {
  ...defaultSiteConfig,
  branding: {
    ...defaultSiteConfig.branding,
    drBadge: {
      domain: 'serpdownloaders.com',
      provider: 'serp-dr',
      style: 'serp-dr-v3'
    },
    favicon: {
      path: 'sites/serpdownloaders/assets/favicon.ico',
      source: 'local-path'
    },
    logo: {
      path: 'sites/serpdownloaders/assets/logo.png',
      source: 'local-path'
    },
    opengraphImage: {
      path: 'sites/serpdownloaders/assets/opengraph-image.png',
      source: 'local-path'
    }
  },
  build: {
    ...defaultSiteConfig.build,
    artifactDir: 'dist/sites/serpdownloaders'
  },
  content: {
    listingSource: {
      category: 'automation-workflow',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/websites.json',
      path: 'sites/serpdownloaders/products.json',
      publishedAt: '2026-03-24'
    }
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
    strategy: 'github-pages-repo-sync'
  },
  features: {
    ...defaultSiteConfig.features,
    showAuth: false,
    showCreatorProjects: false,
    showDocs: false,
    showDeveloperTools: false,
    showFavorites: false,
    showFeaturedGuides: false,
    showGuides: false,
    showNewsletter: true,
    showProjects: false
  },
  id: 'serpdownloaders',
  routes: {
    listingBasePath: defaultSiteConfig.routes.listingBasePath
  },
  site: {
    description: 'Directory of download-focused browser tools.',
    domain: 'serpdownloaders.com',
    name: 'SERP Downloaders',
    publicUrl: 'https://serpdownloaders.com',
    tagline: 'Download-focused product directory'
  },
  social: {
    githubIssueOwner: 'serpcompany',
    githubIssueRepo: 'json-directory-template',
    githubIssueTemplate: 'submit-website.yml',
    githubIssuesUrl: 'https://github.com/serpcompany/json-directory-template/issues/new/choose',
    githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
    githubUrl: 'https://github.com/serpcompany',
    redditUrl: 'https://www.reddit.com/r/serp/',
    twitterUrl: 'https://x.com/serpcompany'
  }
}
