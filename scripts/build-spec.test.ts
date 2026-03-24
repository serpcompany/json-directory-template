import { describe, expect, it } from 'vitest'
import {
  buildSiteDefinitionFromBuildSpec,
  buildSpecFieldTypes,
  buildSpecSchema,
  parseBuildInputArgs,
  validateBuildSpecCompleteness
} from './build-spec.ts'

const exampleBuildSpec = {
  branding: {
    drBadge: {
      domain: 'serpdownloaders.com',
      provider: 'serp-dr',
      style: 'serp-dr-v3'
    }
  },
  build: {
    mode: 'static-directory',
    siteId: 'serpdownloaders'
  },
  content: {
    websiteSource: {
      category: 'automation-workflow',
      featuredCount: 6,
      kind: 'trial-products-json',
      path: 'tmp/serpdownloaders.com/products.json',
      publishedAt: '2026-03-23'
    }
  },
  deploy: {
    branch: 'main',
    preserve: ['.github/workflows/deploy.yml', 'CNAME'],
    repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
    strategy: 'github-pages-repo-sync'
  },
  features: {
    showCreatorProjects: false,
    showDeveloperTools: false,
    showFeaturedGuides: false,
    showNewsletter: true
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
  },
  version: 1
} as const

describe('buildSpecSchema', () => {
  it('accepts a complete build spec for a static directory build', () => {
    expect(buildSpecSchema.parse(exampleBuildSpec)).toMatchObject({
      build: {
        mode: 'static-directory',
        siteId: 'serpdownloaders'
      },
      version: 1
    })
  })

  it('still accepts a raw DR badge shape for compatibility', () => {
    expect(
      buildSpecSchema.parse({
        ...exampleBuildSpec,
        branding: {
          drBadge: {
            alt: 'Verified DR badge for serpdownloaders.com',
            height: 50,
            href: 'https://dr.serp.co/',
            imageSrc: 'https://dr.serp.co/badge/serpdownloaders.com?style=serp-dr-v3',
            kind: 'raw',
            width: 200
          }
        }
      }).branding.drBadge
    ).toMatchObject({
      kind: 'raw'
    })
  })
})

describe('buildSiteDefinitionFromBuildSpec', () => {
  it('maps a build spec into the internal site definition used by the builder', () => {
    expect(buildSiteDefinitionFromBuildSpec(buildSpecSchema.parse(exampleBuildSpec))).toMatchObject({
      build: {
        artifactDir: 'dist/sites/serpdownloaders',
        appOutDir: 'apps/web/out'
      },
      id: 'serpdownloaders',
      site: {
        domain: 'serpdownloaders.com',
        drBadge: {
          alt: 'Verified DR badge for serpdownloaders.com',
          height: 50,
          href: 'https://dr.serp.co/',
          imageSrc: 'https://dr.serp.co/badge/serpdownloaders.com?style=serp-dr-v3',
          width: 200
        },
        features: {
          showDeveloperTools: false,
          showNewsletter: true
        },
        name: 'SERP Downloaders'
      },
      source: {
        kind: 'trial-products-json',
        outputPath: 'data/websites.json',
        path: 'tmp/serpdownloaders.com/products.json'
      }
    })
  })
})

describe('buildSpecFieldTypes', () => {
  it('classifies the operator-facing build contract fields', () => {
    expect(buildSpecFieldTypes['branding.drBadge']).toBe('provider-payload')
    expect(buildSpecFieldTypes['features.showNewsletter']).toBe('boolean')
    expect(buildSpecFieldTypes['social.githubUrl']).toBe('url')
    expect(buildSpecFieldTypes['branding.logo']).toBe('file-reference')
  })
})

describe('parseBuildInputArgs', () => {
  it('prefers explicit build spec input over the checked-in site id', () => {
    expect(parseBuildInputArgs(['--spec', 'sites/serpdownloaders/build-spec.json'])).toEqual({
      specPath: 'sites/serpdownloaders/build-spec.json'
    })
  })

  it('uses BUILD_SPEC_PATH from the environment before falling back to SITE_ID', () => {
    expect(parseBuildInputArgs([], { BUILD_SPEC_PATH: 'sites/serpdownloaders/build-spec.json', SITE_ID: 'ignored-site' }))
      .toEqual({
        specPath: 'sites/serpdownloaders/build-spec.json'
      })
  })
})

describe('validateBuildSpecCompleteness', () => {
  it('fails when placeholder values are still present', () => {
    const incomplete = buildSpecSchema.parse({
      ...exampleBuildSpec,
      site: {
        ...exampleBuildSpec.site,
        name: 'TODO Site Name'
      }
    })

    expect(() => validateBuildSpecCompleteness(incomplete)).toThrow(/site.name/)
  })
})
