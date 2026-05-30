import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  prepareDisabledRoutePathsForStaticExport,
  resolveBuildSourceAppPaths
} from './build-site.ts'

const tempDirs: string[] = []

function makeTempDir(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/build-site-source-paths-'))
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

describe('resolveBuildSourceAppPaths', () => {
  it('derives source-app staging paths from the configured starter app out dir', () => {
    const paths = resolveBuildSourceAppPaths({
      appOutDir: 'apps/starter/out',
      workspaceRoot: '/workspace'
    })

    expect(paths).toEqual({
      accountRoutePath: '/workspace/apps/starter/app/account',
      apiRoutePath: '/workspace/apps/starter/app/api',
      appDir: '/workspace/apps/starter',
      appleTouchIconPath: '/workspace/apps/starter/public/apple-touch-icon.png',
      authRouteBackupPath:
        '/workspace/apps/starter/app/api/auth/[...nextauth]/route.static-export-disabled',
      authRoutePath: '/workspace/apps/starter/app/api/auth/[...nextauth]/route.ts',
      brandsRoutePath: '/workspace/apps/starter/app/brands',
      favoritesRoutePath: '/workspace/apps/starter/app/favorites',
      faviconPath: '/workspace/apps/starter/app/favicon.ico',
      guidesRoutePath: '/workspace/apps/starter/app/guides',
      loginRoutePath: '/workspace/apps/starter/app/login',
      logoPath: '/workspace/apps/starter/public/logo.png',
      opengraphImagePath: '/workspace/apps/starter/app/opengraph-image.png',
      operatorOnboardingPageBackupPath:
        '/workspace/apps/starter/app/operator/onboard-site/page.static-export-disabled',
      operatorOnboardingPagePath: '/workspace/apps/starter/app/operator/onboard-site/page.tsx',
      projectsRoutePath: '/workspace/apps/starter/app/projects',
      docsRoutePath: '/workspace/apps/starter/app/docs',
      searchIndexPath: '/workspace/apps/starter/public/search/search-index.json'
    })
  })

  it('tracks a non-web wrapper app when the configured out dir points elsewhere', () => {
    const paths = resolveBuildSourceAppPaths({
      appOutDir: 'apps/serpdownloaders.com/out',
      workspaceRoot: '/workspace'
    })

    expect(paths.appDir).toBe('/workspace/apps/serpdownloaders.com')
    expect(paths.apiRoutePath).toBe('/workspace/apps/serpdownloaders.com/app/api')
    expect(paths.searchIndexPath).toBe(
      '/workspace/apps/serpdownloaders.com/public/search/search-index.json'
    )
    expect(paths.authRoutePath).toBe(
      '/workspace/apps/serpdownloaders.com/app/api/auth/[...nextauth]/route.ts'
    )
  })
})

describe('prepareDisabledRoutePathsForStaticExport', () => {
  it('stages runtime API routes out of static exports and restores them', () => {
    const workspaceRoot = makeTempDir()
    const paths = resolveBuildSourceAppPaths({
      appOutDir: 'apps/example.com/out',
      workspaceRoot
    })

    writeFile(
      resolve(paths.apiRoutePath, 'cron/check-badges/route.ts'),
      'export async function GET() {}'
    )
    writeFile(resolve(paths.accountRoutePath, 'page.tsx'), 'account')
    writeFile(resolve(paths.loginRoutePath, 'page.tsx'), 'login')
    writeFile(resolve(paths.docsRoutePath, 'page.tsx'), 'docs')

    const routeState = prepareDisabledRoutePathsForStaticExport({
      featureFlags: {
        showAuth: false,
        showBrands: true,
        showDocs: false,
        showFavorites: true,
        showGuides: true,
        showProjects: true
      },
      siteId: 'example.com',
      sourceAppPaths: paths
    })

    expect(existsSync(paths.apiRoutePath)).toBe(false)
    expect(existsSync(paths.accountRoutePath)).toBe(false)
    expect(existsSync(paths.loginRoutePath)).toBe(false)
    expect(existsSync(paths.docsRoutePath)).toBe(false)

    routeState.restore()

    expect(readFileSync(resolve(paths.apiRoutePath, 'cron/check-badges/route.ts'), 'utf8')).toBe(
      'export async function GET() {}'
    )
    expect(readFileSync(resolve(paths.accountRoutePath, 'page.tsx'), 'utf8')).toBe('account')
    expect(readFileSync(resolve(paths.loginRoutePath, 'page.tsx'), 'utf8')).toBe('login')
    expect(readFileSync(resolve(paths.docsRoutePath, 'page.tsx'), 'utf8')).toBe('docs')
  })
})
