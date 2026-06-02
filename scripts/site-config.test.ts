import { resolveCheckedInSiteCategories } from '@thedaviddias/site-contract/categories'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { defaultSiteConfig } from '../sites/site-config.default.ts'
import {
  buildSiteEnvironment,
  loadCheckedInSite,
  resolveResolvedSiteConfig,
  resolveSiteArtifactDir,
  validateCheckedInSiteConfig
} from './site-config.ts'

function cloneDefaultSiteConfig() {
  return structuredClone(defaultSiteConfig)
}

describe('loadCheckedInSite', () => {
  it('loads the checked-in browserextensions.io site config', () => {
    const config = loadCheckedInSite('browserextensions.io')

    expect(config.id).toBe('browserextensions.io')
    expect(config.content.listingSource).toEqual({
      category: 'video-downloaders',
      featuredCount: 0,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/browserextensions.io/products.json',
      publishedAt: '2026-05-16'
    })
    expect(config.site).toMatchObject({
      domain: 'browserextensions.io',
      name: 'BrowserExtensions.io',
      publicUrl: 'https://browserextensions.io'
    })
    expect(config.build).toMatchObject({
      appPackageName: 'browserextensions.io',
      appOutDir: 'apps/browserextensions.io/out',
      artifactDir: 'dist/sites/browserextensions.io'
    })
    expect(config.badges?.featuredOn).toEqual({
      dark: 'badge/featured-on-browserextensions.io-dark.svg',
      light: 'badge/featured-on-browserextensions.io-light.svg'
    })
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.sitemap.pathByGroup).toEqual({
      listings: '/sitemaps/directory/1.xml',
      pages: '/sitemaps/pages/1.xml',
      taxonomies: '/sitemaps/categories/1.xml'
    })
    expect(config.features.showBrands).toBe(true)
    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('browserextensions.io')
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/browserextensions.io/issues'
    )
    expect(config.deploy).toEqual({
      branch: 'main',
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/browserextensions.io.git',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('loads the checked-in serpdownloaders.com site config', () => {
    const config = loadCheckedInSite('serpdownloaders.com')

    expect(config.id).toBe('serpdownloaders.com')
    expect(config.content.listingSource.kind).toBe('trial-products-json')
    expect(config.site.domain).toBe('serpdownloaders.com')
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.routes.docsBasePath).toBe('docs')
    expect(config.routes.networkBasePath).toBe('network')
    expect(config.routes.brandsBasePath).toBe('brands')
    expect(config.content.listingSource.outputPath).toBe('data/listings.json')
    expect(config.copy).toEqual({
      brandsLabel: 'Brands',
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'products',
        singular: 'product'
      },
      networkLabel: 'Network',
      submitLabel: 'Submit Yours'
    })
    expect(config.features.showAuth).toBe(false)
    expect(config.features.showDocs).toBe(false)
    expect(config.features.showExternalResources).toBe(false)
    expect(config.features.showFavorites).toBe(false)
    expect(config.features.showGuides).toBe(false)
    expect(config.features.showNewsletter).toBe(true)
    expect(config.features.showProjects).toBe(false)
    expect(config.features.showBrands).toBe(true)
    expect(config.analytics?.gtmId).toBe('GTM-M82HC3SC')
    expect(config.networkBrandGroup).toBe('mainGroup')
    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('serpdownloaders.com')
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/serpdownloaders.com/issues'
    )
    expect(config.deploy?.strategy).toBe('github-pages-repo-sync')
  })

  it('loads the checked-in serp.ai site config', () => {
    const config = loadCheckedInSite('serp.ai')

    expect(config.id).toBe('serp.ai')
    expect(config.content.listingSource).toEqual({
      category: 'video-downloaders',
      featuredCount: 0,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.ai/products.json',
      publishedAt: '2026-05-16'
    })
    expect(config.site).toMatchObject({
      domain: 'serp.ai',
      name: 'SERP AI',
      publicUrl: 'https://serp.ai'
    })
    expect(config.build).toMatchObject({
      appPackageName: 'serp.ai',
      appOutDir: 'apps/serp.ai/out',
      artifactDir: 'dist/sites/serp.ai'
    })
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.copy.submitLabel).toBe('Submit to SERP AI')
    expect(config.features.showBrands).toBe(true)
    expect(config.networkBrandGroup).toBe('mainGroup')
    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('serp.ai')
    expect(config.social.githubIssuesUrl).toBe('https://github.com/serpcompany/serp.ai/issues')
    expect(config.deploy).toEqual({
      branch: 'main',
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serp.ai.git',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('loads the checked-in pornvideodownloaders.com site config', () => {
    const config = loadCheckedInSite('pornvideodownloaders.com')

    expect(config.id).toBe('pornvideodownloaders.com')
    expect(config.content.listingSource).toEqual({
      category: 'video-downloaders',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/pornvideodownloaders.com/products.json',
      publishedAt: '2026-05-03'
    })
    expect(config.site).toMatchObject({
      domain: 'pornvideodownloaders.com',
      name: 'Porn Video Downloaders',
      publicUrl: 'https://pornvideodownloaders.com'
    })
    expect(config.build).toMatchObject({
      appPackageName: 'pornvideodownloaders.com',
      appOutDir: 'apps/pornvideodownloaders.com/out',
      artifactDir: 'dist/sites/pornvideodownloaders.com'
    })
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.routes.brandsBasePath).toBe('brands')
    expect(config.copy.listingName).toEqual({
      plural: 'products',
      singular: 'product'
    })
    expect(config.copy.brandsLabel).toBe('Brands')
    expect(config.features.showBrands).toBe(true)
    expect(config.networkBrandGroup).toBe('serpxxxGroup')
    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('pornvideodownloaders.com')
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/pornvideodownloaders.com/issues'
    )
    expect(config.deploy).toEqual({
      branch: 'main',
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/pornvideodownloaders.com.git',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('loads the checked-in serp.software site config', () => {
    const config = loadCheckedInSite('serp.software')

    expect(config.id).toBe('serp.software')
    expect(config.content.listingSource).toEqual({
      category: 'video-downloaders',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.software/products.json',
      publishedAt: '2026-05-07'
    })
    expect(config.site).toMatchObject({
      domain: 'serp.software',
      name: 'SERP Software',
      publicUrl: 'https://serp.software'
    })
    expect(config.build).toMatchObject({
      appPackageName: 'serp.software',
      appOutDir: 'apps/serp.software/out',
      artifactDir: 'dist/sites/serp.software'
    })
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.copy.listingName).toEqual({
      plural: 'products',
      singular: 'product'
    })
    expect(config.copy.submitLabel).toBe('Submit Yours')
    expect(config.features.showBrands).toBe(true)
    expect(config.networkBrandGroup).toBe('mainGroup')
    expect(config.analytics?.gtmId).toBe('GTM-W59GNHXF')
    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('serp.software')
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/serp.software/issues'
    )
    expect(config.deploy).toEqual({
      branch: 'main',
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serp.software.git',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('loads the checked-in serp.co site config', () => {
    const config = loadCheckedInSite('serp.co')

    expect(config.id).toBe('serp.co')
    expect(config.content.listingSource).toEqual({
      category: 'other',
      featuredCount: 12,
      kind: 'trial-products-json',
      outputPath: 'data/listings.json',
      path: 'sites/serp.co/products.json',
      publishedAt: '2026-05-16'
    })
    expect(config.site).toMatchObject({
      domain: 'serp.co',
      name: 'SERP',
      publicUrl: 'https://serp.co'
    })
    expect(config.build).toMatchObject({
      appPackageName: 'serp.co',
      appOutDir: 'apps/serp.co/out',
      artifactDir: 'dist/sites/serp.co'
    })
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.routes.brandsBasePath).toBe('brands')
    expect(config.sitemap.categoryBasePath).toBe('products/best')
    expect(config.sitemap.listingDetailSuffix).toBe('reviews')
    expect(config.sitemap.pathByGroup).toEqual({
      listings: '/sitemaps/directory/1.xml',
      pages: '/sitemaps/pages/1.xml',
      posts: '/sitemaps/blog/1.xml',
      taxonomies: '/sitemaps/categories/1.xml'
    })
    expect(config.features.showBrands).toBe(true)
    expect(config.features.showGuides).toBe(true)
    expect(config.analytics?.gtmId).toBe('GTM-W59GNHXF')
    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('serp.co')
    expect(config.social.githubIssuesUrl).toBe('https://github.com/serpcompany/serp.co/issues')
    expect(config.deploy).toEqual({
      branch: 'main',
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serp.co.git',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('loads serp.software checked-in categories instead of default categories', () => {
    expect(resolveCheckedInSiteCategories('serp.software')).toEqual([
      {
        description: 'Browse adult downloader listings and resources.',
        name: 'Adult',
        slug: 'adult'
      },
      {
        name: 'Video Downloaders',
        slug: 'video-downloaders'
      }
    ])
  })

  it('inherits default values when a site override does not redefine them', () => {
    const config = loadCheckedInSite('serpdownloaders.com')

    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('serpdownloaders.com')
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/serpdownloaders.com/issues'
    )
    expect(config.routes.listingBasePath).toBe('products')
    expect(config.routes.docsBasePath).toBe('docs')
    expect(config.routes.networkBasePath).toBe('network')
    expect(config.routes.brandsBasePath).toBe('brands')
    expect(config.copy.submitLabel).toBe('Submit Yours')
    expect(config.copy.brandsLabel).toBe('Brands')
    expect(config.copy.docsLabel).toBe('Docs')
    expect(config.copy.networkLabel).toBe('Network')
    expect(config.analytics?.gtmId).toBe('GTM-M82HC3SC')
    expect(config.features.showNewsletter).toBe(true)
  })

  it('rejects parked site ids that were removed from the active registry', () => {
    for (const siteId of ['extensions.serp.co']) {
      expect(() => loadCheckedInSite(siteId)).toThrow(
        `Site "${siteId}" was removed from this repo. Use a supported checked-in site id instead.`
      )
    }
  })

  it('rejects unknown checked-in site ids instead of silently loading default', () => {
    expect(() => loadCheckedInSite('unknown-site')).toThrow(
      'Site "unknown-site" is not an active checked-in site in this repo. Use "default" or a supported checked-in site id instead.'
    )
  })

  it('loads the checked-in default site config when no site id is provided', () => {
    const config = loadCheckedInSite()

    expect(config.id).toBe('default')
    expect(config.site.domain).toBe('example.com')
    expect(config.content.listingSource.kind).toBe('listing-json')
    expect(config.routes.listingBasePath).toBe('listing')
    expect(config.routes.docsBasePath).toBe('docs')
    expect(config.routes.networkBasePath).toBe('network')
    expect(config.routes.brandsBasePath).toBe('brands')
    expect(config.analytics?.gtmId).toBeUndefined()
    expect(config.copy.listingName.singular).toBe('listing')
    expect(config.copy.brandsLabel).toBe('Brands')
    expect(config.copy.docsLabel).toBe('Docs')
    expect(config.copy.networkLabel).toBe('Network')
    expect(config.features.showBrands).toBe(true)
    expect(config.networkBrandGroup).toBeNull()
  })
})

describe('validateCheckedInSiteConfig', () => {
  it('rejects duplicate public route base paths', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.routes.listingBasePath = invalidConfig.routes.docsBasePath

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'routes.listingBasePath cannot reuse "docs" because routes.docsBasePath already uses it.',
          path: ['routes', 'listingBasePath']
        })
      ])
    )
  })

  it('rejects brands route base paths that collide with other public routes', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.routes.brandsBasePath = invalidConfig.routes.networkBasePath

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'routes.brandsBasePath cannot reuse "network" because routes.networkBasePath already uses it.',
          path: ['routes', 'brandsBasePath']
        })
      ])
    )
  })

  it('rejects reserved public route base paths', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.routes.networkBasePath = 'tools'

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'routes.networkBasePath cannot use "tools". /tools is reserved for future first-party tool pages.',
          path: ['routes', 'networkBasePath']
        })
      ])
    )
  })

  it('rejects listing route base paths that collide with sitemap family names', () => {
    const reservedListingPaths = ['pages', 'sitemap'] as const

    for (const listingBasePath of reservedListingPaths) {
      const invalidConfig = cloneDefaultSiteConfig()
      invalidConfig.routes.listingBasePath = listingBasePath

      let error: unknown

      try {
        validateCheckedInSiteConfig(invalidConfig)
      } catch (caughtError) {
        error = caughtError
      }

      expect(error).toBeInstanceOf(ZodError)
      expect((error as ZodError).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['routes', 'listingBasePath']
          })
        ])
      )
    }
  })

  it('rejects invalid GTM container ids', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.analytics = {
      gtmId: 'UA-INVALID'
    }

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['analytics', 'gtmId']
        })
      ])
    )
  })

  it('rejects duplicate sitemap group output paths', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.sitemap.pathByGroup = {
      listings: '/sitemaps/shared.xml',
      pages: '/sitemaps/shared.xml'
    }

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'sitemap.pathByGroup.pages cannot reuse "/sitemaps/shared.xml" because sitemap.pathByGroup.listings already uses it.',
          path: ['sitemap', 'pathByGroup', 'pages']
        })
      ])
    )
  })

  it('rejects reserved canonical sitemap output paths for group files', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.sitemap.pathByGroup = {
      pages: '/sitemap-index.xml'
    }

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'sitemap.pathByGroup.pages cannot use reserved sitemap output path "/sitemap-index.xml".',
          path: ['sitemap', 'pathByGroup', 'pages']
        })
      ])
    )
  })

  it('rejects static sitemap page paths that are also excluded', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.sitemap.staticPagePaths = ['/', '/search']
    invalidConfig.sitemap.excludedPaths = ['/search']

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'sitemap.staticPagePaths cannot also be excluded: /search.',
          path: ['sitemap', 'staticPagePaths']
        })
      ])
    )
  })

  it('rejects partially configured GitHub issue targets', () => {
    const invalidConfig = cloneDefaultSiteConfig()
    invalidConfig.social.githubIssueOwner = null

    let error: unknown

    try {
      validateCheckedInSiteConfig(invalidConfig)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ZodError)
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'GitHub issue target fields must either all be configured or all be null.',
          path: ['social', 'githubIssueOwner']
        })
      ])
    )
  })
})

describe('resolveSiteArtifactDir', () => {
  it('resolves the configured artifact directory', () => {
    expect(resolveSiteArtifactDir(loadCheckedInSite('serpdownloaders.com'))).toBe(
      'dist/sites/serpdownloaders.com'
    )
  })

  it('resolves the configured pornvideodownloaders artifact directory', () => {
    expect(resolveSiteArtifactDir(loadCheckedInSite('pornvideodownloaders.com'))).toBe(
      'dist/sites/pornvideodownloaders.com'
    )
  })
})

describe('buildSiteEnvironment', () => {
  it('maps a checked-in site config to the minimal app env contract', () => {
    expect(buildSiteEnvironment(loadCheckedInSite('serpdownloaders.com'))).toEqual({
      LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_SITE_ID: 'serpdownloaders.com',
      SITE_ID: 'serpdownloaders.com'
    })
  })

  it('maps pornvideodownloaders.com config to the minimal app env contract', () => {
    expect(buildSiteEnvironment(loadCheckedInSite('pornvideodownloaders.com'))).toEqual({
      LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'products',
      NEXT_PUBLIC_SITE_ID: 'pornvideodownloaders.com',
      SITE_ID: 'pornvideodownloaders.com'
    })
  })
})

describe('resolveResolvedSiteConfig', () => {
  it('resolves the checked-in site config into the app-facing shape', () => {
    expect(resolveResolvedSiteConfig(loadCheckedInSite('serpdownloaders.com'))).toMatchObject({
      copy: {
        listingName: {
          plural: 'products',
          singular: 'product'
        },
        submitLabel: 'Submit Yours'
      },
      description: 'A collection of tools to help you download anything from anywhere, anytime.',
      domain: 'serpdownloaders.com',
      gtmId: 'GTM-M82HC3SC',
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'serpdownloaders.com',
      githubIssuesUrl: 'https://github.com/serpcompany/serpdownloaders.com/issues',
      id: 'serpdownloaders.com',
      networkBrandGroup: 'mainGroup',
      docsRouteBasePath: 'docs',
      brandsRouteBasePath: 'brands',
      listingRouteBasePath: 'products',
      name: 'SERP Downloaders',
      networkRouteBasePath: 'network',
      publicUrl: 'https://serpdownloaders.com',
      tagline: 'For the people who just like to get down...loading'
    })
  })

  it('resolves pornvideodownloaders.com into the app-facing shape', () => {
    expect(resolveResolvedSiteConfig(loadCheckedInSite('pornvideodownloaders.com'))).toMatchObject({
      copy: {
        listingName: {
          plural: 'products',
          singular: 'product'
        },
        submitLabel: 'Submit Yours'
      },
      description: 'Downloaders for adult video platforms and creator sites.',
      domain: 'pornvideodownloaders.com',
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'pornvideodownloaders.com',
      githubIssuesUrl: 'https://github.com/serpcompany/pornvideodownloaders.com/issues',
      id: 'pornvideodownloaders.com',
      networkBrandGroup: 'serpxxxGroup',
      docsRouteBasePath: 'docs',
      brandsRouteBasePath: 'brands',
      listingRouteBasePath: 'products',
      name: 'Porn Video Downloaders',
      networkRouteBasePath: 'network',
      publicUrl: 'https://pornvideodownloaders.com',
      tagline: 'Adult video downloader tools in one searchable directory.'
    })
  })
})
