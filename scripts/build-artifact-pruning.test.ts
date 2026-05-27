import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyConfiguredPublicRoutePaths,
  applyLegacyRootListingRedirects,
  applyListingRouteBasePath,
  copyDeployableStaticArtifactFiles,
  pruneStaticArtifactDir,
  removeExcludedStaticArtifactPaths
} from './build-site.ts'

const tempDirs: string[] = []

function makeTempArtifactDir(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/build-artifact-pruning-'))
  tempDirs.push(dir)
  return dir
}

function writeFile(path: string, contents = 'test'): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => {
    rmSync(dir, { force: true, recursive: true })
  })
})

describe('pruneStaticArtifactDir', () => {
  it('removes forbidden debug files and disabled default route surfaces', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, '.DS_Store'))
    writeFile(resolve(artifactDir, '_next/static/chunks/app.js.map'))
    writeFile(resolve(artifactDir, '__next._tree.txt'))
    writeFile(resolve(artifactDir, 'about/index.html'))
    writeFile(resolve(artifactDir, 'account/index.html'))
    writeFile(resolve(artifactDir, 'login/index.html'))
    writeFile(resolve(artifactDir, 'favorites/index.html'))
    writeFile(resolve(artifactDir, 'brands/index.html'))
    writeFile(resolve(artifactDir, 'projects/index.html'))
    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'guides/index.html'))
    writeFile(resolve(artifactDir, 'posts/index.html'))
    writeFile(resolve(artifactDir, 'operator/onboard-site/index.html'))
    writeFile(resolve(artifactDir, '_not-found/index.html'))
    writeFile(resolve(artifactDir, '404/index.html'))

    pruneStaticArtifactDir(artifactDir, {
      preservePostsRoute: false,
      showAuth: false,
      showBrands: false,
      showDocs: false,
      showFavorites: false,
      showGuides: false,
      showProjects: false
    })

    expect(existsSync(resolve(artifactDir, '.DS_Store'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '_next/static/chunks/app.js.map'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '__next._tree.txt'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'account'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'login'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'favorites'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'brands'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'projects'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'docs'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'guides'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'posts'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'operator'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '_not-found'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '404'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'about'))).toBe(true)
  })

  it('keeps explicitly enabled route surfaces', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'projects/index.html'))
    writeFile(resolve(artifactDir, 'brands/index.html'))
    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'guides/index.html'))
    writeFile(resolve(artifactDir, 'featured/index.html'))
    writeFile(resolve(artifactDir, 'developer-tools/index.html'))

    pruneStaticArtifactDir(artifactDir, {
      preservePostsRoute: false,
      showAuth: false,
      showBrands: true,
      showDocs: true,
      showFavorites: false,
      showGuides: true,
      showProjects: true
    })

    expect(existsSync(resolve(artifactDir, 'projects'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'brands'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'docs'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'guides'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'featured'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'developer-tools'))).toBe(true)
  })
})

describe('copyDeployableStaticArtifactFiles', () => {
  it('copies only deployable files while preserving final route remaps', () => {
    const sourceDir = makeTempArtifactDir()
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(sourceDir, '.DS_Store'))
    writeFile(resolve(sourceDir, '_next/static/chunks/app.js'))
    writeFile(resolve(sourceDir, '_next/static/chunks/app.js.map'))
    writeFile(resolve(sourceDir, '__next._tree.txt'))
    writeFile(resolve(sourceDir, '_not-found/index.html'), 'not found')
    writeFile(resolve(sourceDir, '404/index.html'))
    writeFile(resolve(sourceDir, '404.html'), 'next 404')
    writeFile(resolve(sourceDir, 'account/index.html'))
    writeFile(resolve(sourceDir, 'brands/index.html'), 'brands')
    writeFile(resolve(sourceDir, 'docs/index.html'), 'docs')
    writeFile(resolve(sourceDir, 'projects/index.html'), 'projects')
    writeFile(resolve(sourceDir, 'posts/legacy/index.html'), 'legacy post')
    writeFile(resolve(sourceDir, 'guides/launch/index.html'), 'guide post')
    writeFile(resolve(sourceDir, 'websites/example/index.html'), 'unsuffixed')
    writeFile(resolve(sourceDir, 'websites/example/reviews/index.html'), 'suffixed')
    writeFile(resolve(sourceDir, 'websites/index.html'))
    writeFile(resolve(sourceDir, 'search/index.html'))
    writeFile(resolve(sourceDir, 'featured/index.html'), 'root featured')
    writeFile(resolve(sourceDir, 'categories/featured/index.html'), 'raw featured')
    writeFile(resolve(sourceDir, 'categories/extra/index.html'), 'extra category')

    copyDeployableStaticArtifactFiles(sourceDir, artifactDir, {
      artifactExcludedPaths: ['/products', '/search'],
      artifactFlags: {
        preservePostsRoute: false,
        showAuth: false,
        showBrands: true,
        showDocs: true,
        showFavorites: false,
        showGuides: true,
        showProjects: true
      },
      brandsBasePath: 'partners',
      docsBasePath: 'learn',
      listingBasePath: 'products',
      listingDetailSuffix: 'reviews',
      networkBasePath: 'network'
    })

    expect(existsSync(resolve(artifactDir, '_next/static/chunks/app.js'))).toBe(true)
    expect(existsSync(resolve(artifactDir, '_next/static/chunks/app.js.map'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '__next._tree.txt'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '_not-found'))).toBe(false)
    expect(existsSync(resolve(artifactDir, '404'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, '404.html'), 'utf8')).toBe('next 404')
    expect(existsSync(resolve(artifactDir, 'account'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'brands'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'partners/index.html'), 'utf8')).toBe('brands')
    expect(existsSync(resolve(artifactDir, 'docs'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'learn/index.html'), 'utf8')).toBe('docs')
    expect(existsSync(resolve(artifactDir, 'projects'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'network/index.html'), 'utf8')).toBe('projects')
    expect(existsSync(resolve(artifactDir, 'posts/legacy'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'posts/launch/index.html'), 'utf8')).toBe('guide post')
    expect(existsSync(resolve(artifactDir, 'websites'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'products/index.html'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'products/example/index.html'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'products/example/reviews/index.html'), 'utf8')).toBe(
      'suffixed'
    )
    expect(existsSync(resolve(artifactDir, 'search'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'featured'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'categories/featured/index.html'), 'utf8')).toBe(
      'root featured'
    )
    expect(readFileSync(resolve(artifactDir, 'categories/extra/index.html'), 'utf8')).toBe(
      'extra category'
    )
  })

  it('skips generated category aliases when a category base path is configured', () => {
    const sourceDir = makeTempArtifactDir()
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(sourceDir, 'categories/featured/index.html'))
    writeFile(resolve(sourceDir, 'featured/index.html'))
    writeFile(resolve(sourceDir, 'products/best/featured/index.html'))

    copyDeployableStaticArtifactFiles(sourceDir, artifactDir, {
      artifactExcludedPaths: [],
      artifactFlags: {
        preservePostsRoute: false,
        showAuth: false,
        showBrands: false,
        showDocs: false,
        showFavorites: false,
        showGuides: false,
        showProjects: false
      },
      brandsBasePath: 'brands',
      categoryBasePath: 'products/best',
      docsBasePath: 'docs',
      listingBasePath: 'products',
      networkBasePath: 'network'
    })

    expect(existsSync(resolve(artifactDir, 'categories'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'featured'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'products/best/featured/index.html'))).toBe(true)
  })
})

describe('removeExcludedStaticArtifactPaths', () => {
  it('removes configured public route paths from the static artifact', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'categories/featured/index.html'))
    writeFile(resolve(artifactDir, 'products/index.html'))
    writeFile(resolve(artifactDir, 'products/example-extension/index.html'))
    writeFile(resolve(artifactDir, 'search/index.html'))
    writeFile(resolve(artifactDir, 'legal/privacy/index.html'))
    writeFile(resolve(artifactDir, 'legal/terms/index.html'))
    writeFile(resolve(artifactDir, 'legal/privacy-policy/index.html'))

    removeExcludedStaticArtifactPaths(artifactDir, [
      '/categories/featured',
      '/products',
      '/search',
      '/legal/privacy',
      '/legal/terms'
    ])

    expect(existsSync(resolve(artifactDir, 'categories/featured'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'products/index.html'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'products/example-extension/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'search'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'legal/privacy'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'legal/terms'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'legal/privacy-policy/index.html'))).toBe(true)
  })

  it('does not remove the artifact root for slash or empty paths', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'index.html'))

    removeExcludedStaticArtifactPaths(artifactDir, ['/', '', '  '])

    expect(existsSync(resolve(artifactDir, 'index.html'))).toBe(true)
  })
})

describe('applyListingRouteBasePath', () => {
  it('renames the default listing artifact path when a custom public base path is configured', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'websites/index.html'))
    writeFile(resolve(artifactDir, 'websites/example/index.html'))

    applyListingRouteBasePath(artifactDir, 'directory')

    expect(existsSync(resolve(artifactDir, 'websites'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'directory/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'directory/example/index.html'))).toBe(true)
  })

  it('keeps the public default artifact path when the configured public base path is listing', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'websites/index.html'))

    applyListingRouteBasePath(artifactDir, 'listing')

    expect(existsSync(resolve(artifactDir, 'websites'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'listing/index.html'))).toBe(true)
  })
})

describe('applyConfiguredPublicRoutePaths', () => {
  it('renames docs, posts, categories, and network artifact paths when public paths are configured', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'docs/getting-started/index.html'))
    writeFile(resolve(artifactDir, 'guides/index.html'))
    writeFile(resolve(artifactDir, 'guides/launch-notes/index.html'))
    writeFile(resolve(artifactDir, 'projects/index.html'))
    writeFile(resolve(artifactDir, 'projects/repository/index.html'))
    writeFile(resolve(artifactDir, 'brands/index.html'))
    writeFile(resolve(artifactDir, 'brands/serp/index.html'))
    writeFile(resolve(artifactDir, 'featured/index.html'))
    writeFile(resolve(artifactDir, 'developer-tools/index.html'))

    applyConfiguredPublicRoutePaths(artifactDir, {
      brandsBasePath: 'partners',
      docsBasePath: 'seo-docs',
      listingBasePath: 'listing',
      networkBasePath: 'network'
    })

    expect(existsSync(resolve(artifactDir, 'docs'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'guides'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'projects'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'brands'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'seo-docs/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'seo-docs/getting-started/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'posts/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'posts/launch-notes/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'categories/featured/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'categories/developer-tools/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'listing'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'network/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'network/repository/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'partners/index.html'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'partners/serp/index.html'))).toBe(true)
  })
})

describe('applyLegacyRootListingRedirects', () => {
  it('creates static root-path redirect pages for serpdownloaders listing slugs', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(
      resolve(artifactDir, 'products/instagram-downloader/index.html'),
      '<html><body>instagram</body></html>'
    )
    writeFile(
      resolve(artifactDir, 'products/getty-images-downloader/index.html'),
      '<html><body>getty</body></html>'
    )

    applyLegacyRootListingRedirects(artifactDir, {
      listingBasePath: 'products',
      siteId: 'serpdownloaders.com'
    })

    const redirectPagePath = resolve(artifactDir, 'instagram-downloader/index.html')

    expect(existsSync(redirectPagePath)).toBe(true)
    expect(readFileSync(redirectPagePath, 'utf8')).toContain('/products/instagram-downloader/')
    expect(existsSync(resolve(artifactDir, 'getty-images-downloader/index.html'))).toBe(true)
  })
})
