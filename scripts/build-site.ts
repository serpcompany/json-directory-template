import { spawnSync } from 'node:child_process'
import {
  closeSync,
  copyFileSync,
  existsSync,
  constants as fsConstants,
  mkdirSync,
  openSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSiteRootListingAliases } from '@thedaviddias/site-contract/site-root-listing-aliases'
import type { AssetSource } from '@thedaviddias/site-contract/types'
import { categories } from '@thedaviddias/web-core/categories'
import { createRunTempDir } from './run-context.ts'
import {
  buildSiteEnvironment,
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  resolveSiteAppOutDir,
  resolveSiteAppPackageName,
  resolveSiteArtifactDir,
  type SiteInputTarget
} from './site-config.ts'
import { prepareSiteData } from './site-data.ts'
import { writeSplitSitemaps } from './sitemap-files.ts'
import { validateSite } from './validate-site.ts'

const workspaceRoot = resolve(process.cwd())

type StagedPath = {
  activePath: string
  backupPath: string
}

type BuildSourceAppPaths = {
  accountRoutePath: string
  apiRoutePath: string
  appDir: string
  appleTouchIconPath: string
  authRouteBackupPath: string
  authRoutePath: string
  brandsRoutePath: string
  docsRoutePath: string
  favoritesRoutePath: string
  faviconPath: string
  guidesRoutePath: string
  loginRoutePath: string
  logoPath: string
  opengraphImagePath: string
  operatorOnboardingPageBackupPath: string
  operatorOnboardingPagePath: string
  projectsRoutePath: string
  searchIndexPath: string
}

type StaticExportRouteFeatureFlags = {
  showAuth: boolean
  showBrands: boolean
  showDocs: boolean
  showFavorites: boolean
  showGuides: boolean
  showProjects: boolean
}

type StaticExportRoutePaths = Pick<
  BuildSourceAppPaths,
  | 'accountRoutePath'
  | 'apiRoutePath'
  | 'brandsRoutePath'
  | 'docsRoutePath'
  | 'favoritesRoutePath'
  | 'guidesRoutePath'
  | 'loginRoutePath'
  | 'projectsRoutePath'
>

export function resolveBuildSourceAppPaths({
  appOutDir,
  workspaceRoot = process.cwd()
}: {
  appOutDir: string
  workspaceRoot?: string
}): BuildSourceAppPaths {
  const resolvedAppOutDir = resolve(workspaceRoot, appOutDir)
  const appDir = dirname(resolvedAppOutDir)

  return {
    accountRoutePath: resolve(appDir, 'app/account'),
    apiRoutePath: resolve(appDir, 'app/api'),
    appDir,
    appleTouchIconPath: resolve(appDir, 'public/apple-touch-icon.png'),
    authRouteBackupPath: resolve(appDir, 'app/api/auth/[...nextauth]/route.static-export-disabled'),
    authRoutePath: resolve(appDir, 'app/api/auth/[...nextauth]/route.ts'),
    brandsRoutePath: resolve(appDir, 'app/brands'),
    docsRoutePath: resolve(appDir, 'app/docs'),
    favoritesRoutePath: resolve(appDir, 'app/favorites'),
    faviconPath: resolve(appDir, 'app/favicon.ico'),
    guidesRoutePath: resolve(appDir, 'app/guides'),
    loginRoutePath: resolve(appDir, 'app/login'),
    logoPath: resolve(appDir, 'public/logo.png'),
    opengraphImagePath: resolve(appDir, 'app/opengraph-image.png'),
    operatorOnboardingPageBackupPath: resolve(
      appDir,
      'app/operator/onboard-site/page.static-export-disabled'
    ),
    operatorOnboardingPagePath: resolve(appDir, 'app/operator/onboard-site/page.tsx'),
    projectsRoutePath: resolve(appDir, 'app/projects'),
    searchIndexPath: resolve(appDir, 'public/search/search-index.json')
  }
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit'
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`)
  }
}

function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true })
}

function backupFile(path: string, backupPath: string): boolean {
  if (!existsSync(path)) {
    return false
  }

  ensureParentDir(backupPath)
  copyFileSync(path, backupPath)
  return true
}

function restoreFile(path: string, backupPath: string, hadOriginal: boolean): void {
  if (hadOriginal && existsSync(backupPath)) {
    copyFileSync(backupPath, path)
  }
}

function restoreFileOrDelete(path: string, backupPath: string, hadOriginal: boolean): void {
  if (hadOriginal) {
    restoreFile(path, backupPath, true)
    return
  }

  if (existsSync(path)) {
    rmSync(path, { force: true })
  }
}

function stagePath(activePath: string, backupPath: string): StagedPath | null {
  if (!existsSync(activePath)) {
    return null
  }

  ensureParentDir(backupPath)
  renameSync(activePath, backupPath)

  return {
    activePath,
    backupPath
  }
}

function restoreStagedPath(stage: StagedPath): void {
  if (!existsSync(stage.backupPath)) {
    return
  }

  renameSync(stage.backupPath, stage.activePath)
}

function prepareSourceData(input: SiteInputTarget): { restore: () => void } {
  const definition = loadCheckedInSiteFromInput(input)
  const sourcePlan = definition.content.listingSource
  const restoreDir = createRunTempDir('build-site-source', definition.id)
  const outputPath = resolve(workspaceRoot, sourcePlan.outputPath)
  const backupPath = resolve(restoreDir.path, 'data-listings.json.backup')
  const hadOriginal = backupFile(outputPath, backupPath)

  ensureParentDir(outputPath)
  prepareSiteData(input)

  return {
    restore: () => {
      restoreFile(outputPath, backupPath, hadOriginal)
      restoreDir.cleanup()
    }
  }
}

function prepareSearchIndex(
  input: SiteInputTarget,
  env: NodeJS.ProcessEnv
): { restore: () => void } {
  const definition = loadCheckedInSiteFromInput(input)
  const sourceAppPaths = resolveBuildSourceAppPaths({
    appOutDir: resolveSiteAppOutDir(definition),
    workspaceRoot
  })
  const restoreDir = createRunTempDir('build-site-search', definition.id)
  const backupPath = resolve(restoreDir.path, 'search-index.json.backup')
  const hadOriginal = backupFile(sourceAppPaths.searchIndexPath, backupPath)

  run('pnpm', ['tsx', 'scripts/search-index-generator.ts'], env)

  return {
    restore: () => {
      restoreFile(sourceAppPaths.searchIndexPath, backupPath, hadOriginal)
      restoreDir.cleanup()
    }
  }
}

type AssetStage = {
  backupPath: string
  hadOriginal: boolean
  targetPath: string
}

type BrandAssetKind = 'favicon' | 'logo' | 'opengraphImage'

type ResolveStagedBrandAssetPathInput = {
  assetKind: BrandAssetKind
  siteId: string
  workspaceRoot?: string
}

type EnsureStagedBrandAssetSourceInput = {
  asset: Extract<AssetSource, { source: 'url' }>
  assetKind: BrandAssetKind
  siteId: string
  workspaceRoot?: string
}

const stagedBrandAssetFilenames: Record<BrandAssetKind, string> = {
  favicon: 'favicon.ico',
  logo: 'logo.png',
  opengraphImage: 'opengraph-image.png'
}

const expectedBrandAssetContentTypes: Record<BrandAssetKind, string[]> = {
  favicon: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/ico'],
  logo: ['image/png'],
  opengraphImage: ['image/png']
}

function normalizeContentType(contentType: string | null): string | null {
  if (!contentType) {
    return null
  }

  return contentType.split(';', 1)[0]?.trim().toLowerCase() ?? null
}

function resolveExpectedBrandAssetLabel(assetKind: BrandAssetKind): string {
  if (assetKind === 'opengraphImage') {
    return 'Open Graph image'
  }

  return assetKind
}

export function resolveStagedBrandAssetPath({
  assetKind,
  siteId,
  workspaceRoot = process.cwd()
}: ResolveStagedBrandAssetPathInput): string {
  return resolve(workspaceRoot, 'sites', siteId, 'assets', stagedBrandAssetFilenames[assetKind])
}

export async function ensureStagedBrandAssetSource({
  asset,
  assetKind,
  siteId,
  workspaceRoot = process.cwd()
}: EnsureStagedBrandAssetSourceInput): Promise<string> {
  const stagedPath = resolveStagedBrandAssetPath({
    assetKind,
    siteId,
    workspaceRoot
  })

  if (existsSync(stagedPath) && statSync(stagedPath).size > 0) {
    return stagedPath
  }

  const response = await fetch(asset.url)

  if (!response.ok) {
    throw new Error(
      `Failed to download remote ${resolveExpectedBrandAssetLabel(
        assetKind
      )} asset for site ${siteId}: ${response.status} ${response.statusText}`
    )
  }

  const contentType = normalizeContentType(response.headers.get('content-type'))
  const expectedContentTypes = expectedBrandAssetContentTypes[assetKind]
  const urlPathname = new URL(asset.url).pathname.toLowerCase()
  const expectedFilename = stagedBrandAssetFilenames[assetKind]
  const matchesContentType = contentType ? expectedContentTypes.includes(contentType) : false
  const matchesExpectedFilename = urlPathname.endsWith(expectedFilename)

  if (!matchesContentType && !matchesExpectedFilename) {
    throw new Error(
      `Remote ${assetKind} asset for site ${siteId} must be ${expectedContentTypes[0]} before it can be staged locally.`
    )
  }

  const assetBytes = new Uint8Array(await response.arrayBuffer())

  if (assetBytes.byteLength === 0) {
    throw new Error(
      `Remote ${resolveExpectedBrandAssetLabel(
        assetKind
      )} asset for site ${siteId} downloaded successfully but was empty.`
    )
  }

  mkdirSync(dirname(stagedPath), { recursive: true })
  writeFileSync(stagedPath, assetBytes)

  return stagedPath
}

function stageLocalAsset(sourcePath: string, targetPath: string, backupPath: string): AssetStage {
  const hadOriginal = backupFile(targetPath, backupPath)
  ensureParentDir(targetPath)
  copyFileSync(sourcePath, targetPath)

  return {
    backupPath,
    hadOriginal,
    targetPath
  }
}

async function prepareBrandAssets(input: SiteInputTarget): Promise<{ restore: () => void }> {
  const siteConfig = loadCheckedInSiteFromInput(input)
  const sourceAppPaths = resolveBuildSourceAppPaths({
    appOutDir: resolveSiteAppOutDir(siteConfig),
    workspaceRoot
  })
  const restoreDir = createRunTempDir('build-site-assets', siteConfig.id)
  const stages: AssetStage[] = []

  const favicon = siteConfig.branding.favicon
  if (favicon) {
    const faviconSourcePath =
      favicon.source === 'local-path'
        ? resolve(workspaceRoot, favicon.path)
        : await ensureStagedBrandAssetSource({
            asset: favicon,
            assetKind: 'favicon',
            siteId: siteConfig.id,
            workspaceRoot
          })

    if (!faviconSourcePath.endsWith('.ico')) {
      throw new Error(
        'Build currently supports favicon staging only from .ico files. Use sites/<site-id>/assets/favicon.ico.'
      )
    }

    stages.push(
      stageLocalAsset(
        faviconSourcePath,
        sourceAppPaths.faviconPath,
        resolve(restoreDir.path, 'favicon.ico.backup')
      )
    )
  }

  const logo = siteConfig.branding.logo
  if (logo) {
    const logoSourcePath =
      logo.source === 'local-path'
        ? resolve(workspaceRoot, logo.path)
        : await ensureStagedBrandAssetSource({
            asset: logo,
            assetKind: 'logo',
            siteId: siteConfig.id,
            workspaceRoot
          })

    if (!logoSourcePath.endsWith('.png')) {
      throw new Error(
        'Build currently supports logo staging only from .png files. Use sites/<site-id>/assets/logo.png.'
      )
    }

    stages.push(
      stageLocalAsset(
        logoSourcePath,
        sourceAppPaths.logoPath,
        resolve(restoreDir.path, 'logo.png.backup')
      )
    )

    const explicitAppleTouchIconPath = resolve(
      workspaceRoot,
      'sites',
      siteConfig.id,
      'assets',
      'apple-touch-icon.png'
    )
    const appleTouchIconSourcePath = existsSync(explicitAppleTouchIconPath)
      ? explicitAppleTouchIconPath
      : logoSourcePath

    stages.push(
      stageLocalAsset(
        appleTouchIconSourcePath,
        sourceAppPaths.appleTouchIconPath,
        resolve(restoreDir.path, 'apple-touch-icon.png.backup')
      )
    )
  }

  const opengraphImage = siteConfig.branding.opengraphImage
  if (opengraphImage) {
    const opengraphImageSourcePath =
      opengraphImage.source === 'local-path'
        ? resolve(workspaceRoot, opengraphImage.path)
        : await ensureStagedBrandAssetSource({
            asset: opengraphImage,
            assetKind: 'opengraphImage',
            siteId: siteConfig.id,
            workspaceRoot
          })

    if (!opengraphImageSourcePath.endsWith('.png')) {
      throw new Error(
        'Build currently supports Open Graph image staging only from .png files. Use sites/<site-id>/assets/opengraph-image.png.'
      )
    }

    stages.push(
      stageLocalAsset(
        opengraphImageSourcePath,
        sourceAppPaths.opengraphImagePath,
        resolve(restoreDir.path, 'opengraph-image.png.backup')
      )
    )
  }

  return {
    restore: () => {
      stages.forEach(stage => {
        restoreFileOrDelete(stage.targetPath, stage.backupPath, stage.hadOriginal)
      })
      restoreDir.cleanup()
    }
  }
}

export function prepareDisabledRoutePathsForStaticExport({
  featureFlags,
  siteId,
  sourceAppPaths
}: {
  featureFlags: StaticExportRouteFeatureFlags
  siteId: string
  sourceAppPaths: StaticExportRoutePaths
}): { restore: () => void } {
  const restoreDir = createRunTempDir('build-site-routes', siteId)
  const stages: StagedPath[] = []

  const maybeStage = (activePath: string, backupName: string): void => {
    const stage = stagePath(
      activePath,
      resolve(restoreDir.path, backupName)
    )

    if (stage) {
      stages.push(stage)
    }
  }

  maybeStage(sourceAppPaths.apiRoutePath, 'api')

  if (!featureFlags.showAuth) {
    maybeStage(sourceAppPaths.accountRoutePath, 'account')
    maybeStage(sourceAppPaths.loginRoutePath, 'login')
  }

  if (!featureFlags.showFavorites) {
    maybeStage(sourceAppPaths.favoritesRoutePath, 'favorites')
  }

  if (!featureFlags.showProjects) {
    maybeStage(sourceAppPaths.projectsRoutePath, 'projects')
  }

  if (!featureFlags.showBrands) {
    maybeStage(sourceAppPaths.brandsRoutePath, 'brands')
  }

  if (!featureFlags.showDocs) {
    maybeStage(sourceAppPaths.docsRoutePath, 'docs')
  }

  if (!featureFlags.showGuides) {
    maybeStage(sourceAppPaths.guidesRoutePath, 'guides')
  }

  return {
    restore: () => {
      stages.reverse().forEach(restoreStagedPath)
      restoreDir.cleanup()
    }
  }
}

function prepareDisabledRoutesForStaticExport(input: SiteInputTarget): { restore: () => void } {
  const definition = loadCheckedInSiteFromInput(input)
  const sourceAppPaths = resolveBuildSourceAppPaths({
    appOutDir: resolveSiteAppOutDir(definition),
    workspaceRoot
  })

  return prepareDisabledRoutePathsForStaticExport({
    featureFlags: definition.features,
    siteId: definition.id,
    sourceAppPaths
  })
}

type ArtifactSurfaceFlags = {
  preservePostsRoute: boolean
  showAuth: boolean
  showBrands: boolean
  showDocs: boolean
  showFavorites: boolean
  showGuides: boolean
  showProjects: boolean
}

const categoryArtifactSlugs = ['featured', ...categories.map(category => category.slug)]

function removeArtifactPath(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { force: true, recursive: true })
  }
}

function removeArtifactRouteIndex(path: string): void {
  if (!existsSync(path)) {
    return
  }

  if (!statSync(path).isDirectory()) {
    removeArtifactPath(path)
    return
  }

  removeArtifactPath(resolve(path, 'index.html'))

  if (existsSync(path) && readdirSync(path).length === 0) {
    removeArtifactPath(path)
  }
}

function normalizePublicArtifactPath(path: string): string | null {
  const normalizedPath = path
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')

  if (!normalizedPath) {
    return null
  }

  const segments = normalizedPath.split('/').filter(Boolean)

  if (segments.some(segment => segment === '..')) {
    return null
  }

  return segments.join('/')
}

function normalizePublicArtifactSegments(path: string): string[] | null {
  const normalizedPath = normalizePublicArtifactPath(path)

  return normalizedPath ? normalizedPath.split('/') : null
}

function segmentsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

function hasSegmentPrefix(pathSegments: string[], prefixSegments: string[]): boolean {
  return (
    pathSegments.length >= prefixSegments.length &&
    prefixSegments.every((segment, index) => pathSegments[index] === segment)
  )
}

function replaceSegmentPrefix(
  pathSegments: string[],
  sourcePrefix: string[],
  targetPrefix: string[]
): string[] {
  if (!hasSegmentPrefix(pathSegments, sourcePrefix)) {
    return pathSegments
  }

  return [...targetPrefix, ...pathSegments.slice(sourcePrefix.length)]
}

function isPrunedArtifactFileName(name: string): boolean {
  return (
    name === '.DS_Store' ||
    name.endsWith('.map') ||
    (name.startsWith('__next') && name.endsWith('.txt')) ||
    name === 'index.txt'
  )
}

type ArtifactCopyRouteMapping = {
  source: string[]
  target: string[]
}

function createArtifactCopyRouteMappings(input: {
  appOutDir: string
  artifactFlags: ArtifactSurfaceFlags
  brandsBasePath: string
  categoryBasePath?: string
  docsBasePath: string
  listingBasePath: string
  networkBasePath: string
}): ArtifactCopyRouteMapping[] {
  const mappings: ArtifactCopyRouteMapping[] = []
  const addMapping = (sourcePath: string, targetPath: string): void => {
    const source = normalizePublicArtifactSegments(sourcePath)
    const target = normalizePublicArtifactSegments(targetPath)

    if (!source || !target || segmentsEqual(source, target)) {
      return
    }

    mappings.push({ source, target })
  }

  addMapping('websites', input.listingBasePath)

  if (input.artifactFlags.showBrands) {
    addMapping('brands', input.brandsBasePath)
  }

  if (input.artifactFlags.showDocs) {
    addMapping('docs', input.docsBasePath)
  }

  if (input.artifactFlags.showGuides) {
    addMapping('guides', 'posts')
  }

  if (input.artifactFlags.showProjects) {
    addMapping('projects', input.networkBasePath)
  }

  if (!input.categoryBasePath) {
    for (const slug of categoryArtifactSlugs) {
      addMapping(slug, `categories/${slug}`)
    }
  }

  return mappings.filter(({ source }) => existsSync(resolve(input.appOutDir, ...source)))
}

function createSkippedArtifactSourceRoots(input: {
  appOutDir: string
  artifactFlags: ArtifactSurfaceFlags
  categoryBasePath?: string
  routeMappings: ArtifactCopyRouteMapping[]
}): string[][] {
  const skippedRoots: string[][] = [['_not-found'], ['404'], ['operator']]

  if (!input.artifactFlags.showAuth) {
    skippedRoots.push(['account'], ['login'])
  }

  if (!input.artifactFlags.showFavorites) {
    skippedRoots.push(['favorites'])
  }

  if (!input.artifactFlags.showProjects) {
    skippedRoots.push(['projects'])
  }

  if (!input.artifactFlags.showBrands) {
    skippedRoots.push(['brands'])
  }

  if (!input.artifactFlags.showDocs) {
    skippedRoots.push(['docs'])
  }

  if (!input.artifactFlags.showGuides) {
    skippedRoots.push(['guides'])
    if (!input.artifactFlags.preservePostsRoute) {
      skippedRoots.push(['posts'])
    }
  }

  if (input.categoryBasePath) {
    skippedRoots.push(['categories'])
    for (const slug of categoryArtifactSlugs) {
      skippedRoots.push([slug])
    }
  }

  for (const { source, target } of input.routeMappings) {
    if (segmentsEqual(source, target)) {
      continue
    }

    skippedRoots.push(target)
  }

  return skippedRoots.filter(
    (segments, index, allSegments) =>
      allSegments.findIndex(candidate => segmentsEqual(candidate, segments)) === index
  )
}

function mapDeployableArtifactSegments(
  sourceSegments: string[],
  routeMappings: ArtifactCopyRouteMapping[]
): string[] {
  for (const { source, target } of routeMappings) {
    if (hasSegmentPrefix(sourceSegments, source)) {
      return replaceSegmentPrefix(sourceSegments, source, target)
    }
  }

  return sourceSegments
}

function isExcludedArtifactRouteIndex(
  targetFileSegments: string[],
  excludedRouteSegments: string[][]
): boolean {
  return excludedRouteSegments.some(
    routeSegments =>
      segmentsEqual(targetFileSegments, routeSegments) ||
      segmentsEqual(targetFileSegments, [...routeSegments, 'index.html'])
  )
}

function isUnsuffixedListingDetailIndex(input: {
  appOutDir: string
  listingBasePath: string
  listingDetailSuffix?: string
  sourceFileSegments: string[]
  targetFileSegments: string[]
}): boolean {
  const suffix = input.listingDetailSuffix?.replace(/^\/+|\/+$/g, '')

  if (!suffix) {
    return false
  }

  const listingBaseSegments = normalizePublicArtifactSegments(input.listingBasePath)

  if (!listingBaseSegments) {
    return false
  }

  if (
    input.targetFileSegments.length !== listingBaseSegments.length + 2 ||
    input.targetFileSegments.at(-1) !== 'index.html' ||
    !hasSegmentPrefix(input.targetFileSegments, listingBaseSegments)
  ) {
    return false
  }

  const suffixedSourceIndexPath = resolve(
    input.appOutDir,
    ...input.sourceFileSegments.slice(0, -1),
    suffix,
    'index.html'
  )

  return existsSync(suffixedSourceIndexPath)
}

export function copyDeployableStaticArtifactFiles(
  appOutDir: string,
  artifactDir: string,
  input: {
    artifactExcludedPaths: string[]
    artifactFlags: ArtifactSurfaceFlags
    brandsBasePath: string
    categoryBasePath?: string
    docsBasePath: string
    listingBasePath: string
    listingDetailSuffix?: string
    networkBasePath: string
  }
): void {
  const routeMappings = createArtifactCopyRouteMappings({
    appOutDir,
    artifactFlags: input.artifactFlags,
    brandsBasePath: input.brandsBasePath,
    categoryBasePath: input.categoryBasePath,
    docsBasePath: input.docsBasePath,
    listingBasePath: input.listingBasePath,
    networkBasePath: input.networkBasePath
  })
  const skippedSourceRoots = createSkippedArtifactSourceRoots({
    appOutDir,
    artifactFlags: input.artifactFlags,
    categoryBasePath: input.categoryBasePath,
    routeMappings
  })
  const excludedRouteSegments = input.artifactExcludedPaths
    .map(normalizePublicArtifactSegments)
    .filter((segments): segments is string[] => Boolean(segments))

  const copyTree = (sourceSegments: string[]): void => {
    if (skippedSourceRoots.some(root => hasSegmentPrefix(sourceSegments, root))) {
      return
    }

    const sourcePath = resolve(appOutDir, ...sourceSegments)
    const entries = readdirSync(sourcePath, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name)
    )

    for (const entry of entries) {
      const entrySourceSegments = [...sourceSegments, entry.name]

      if (entry.isDirectory()) {
        copyTree(entrySourceSegments)
        continue
      }

      if (isPrunedArtifactFileName(entry.name)) {
        continue
      }

      const targetFileSegments = mapDeployableArtifactSegments(entrySourceSegments, routeMappings)

      if (isExcludedArtifactRouteIndex(targetFileSegments, excludedRouteSegments)) {
        continue
      }

      if (
        isUnsuffixedListingDetailIndex({
          appOutDir,
          listingBasePath: input.listingBasePath,
          listingDetailSuffix: input.listingDetailSuffix,
          sourceFileSegments: entrySourceSegments,
          targetFileSegments
        })
      ) {
        continue
      }

      const targetPath = resolve(artifactDir, ...targetFileSegments)
      mkdirSync(dirname(targetPath), { recursive: true })
      copyFileSync(
        resolve(appOutDir, ...entrySourceSegments),
        targetPath,
        fsConstants.COPYFILE_FICLONE
      )
    }
  }

  mkdirSync(artifactDir, { recursive: true })
  copyTree([])
}

export function removeExcludedStaticArtifactPaths(
  artifactDir: string,
  excludedPaths: string[]
): void {
  for (const excludedPath of excludedPaths) {
    const normalizedPath = normalizePublicArtifactPath(excludedPath)

    if (!normalizedPath) {
      continue
    }

    removeArtifactRouteIndex(resolve(artifactDir, normalizedPath))
  }
}

export function applyListingRouteBasePath(artifactDir: string, listingBasePath: string): void {
  applyPublicRouteBasePath(artifactDir, 'websites', listingBasePath)
}

function applyCategoryRoutePaths(artifactDir: string): void {
  const categoryBasePath = resolve(artifactDir, 'categories')

  mkdirSync(categoryBasePath, { recursive: true })

  for (const slug of categoryArtifactSlugs) {
    const sourcePath = resolve(artifactDir, slug)
    const targetPath = resolve(categoryBasePath, slug)

    if (!existsSync(sourcePath)) {
      continue
    }

    removeArtifactPath(targetPath)
    renameSync(sourcePath, targetPath)
  }
}

function applyPublicRouteBasePath(
  artifactDir: string,
  defaultBasePath: string,
  publicBasePath: string
): void {
  const normalizedBasePath = publicBasePath.replace(/^\/+|\/+$/g, '')

  if (!normalizedBasePath || normalizedBasePath === defaultBasePath) {
    return
  }

  const defaultListingsPath = resolve(artifactDir, defaultBasePath)
  const targetListingsPath = resolve(artifactDir, normalizedBasePath)

  if (!existsSync(defaultListingsPath)) {
    return
  }

  removeArtifactPath(targetListingsPath)
  renameSync(defaultListingsPath, targetListingsPath)
}

type ArtifactPublicRoutePaths = {
  brandsBasePath: string
  docsBasePath: string
  listingBasePath: string
  networkBasePath: string
}

type LegacyRootListingRedirectInput = {
  listingBasePath: string
  siteId: string
}

function buildStaticRedirectHtml(destinationPath: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=${destinationPath}">
    <link rel="canonical" href="${destinationPath}">
    <script>window.location.replace(${JSON.stringify(destinationPath)});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${destinationPath}">${destinationPath}</a>.</p>
  </body>
</html>
`
}

export function applyConfiguredPublicRoutePaths(
  artifactDir: string,
  paths: ArtifactPublicRoutePaths
): void {
  applyListingRouteBasePath(artifactDir, paths.listingBasePath)
  applyPublicRouteBasePath(artifactDir, 'brands', paths.brandsBasePath)
  applyPublicRouteBasePath(artifactDir, 'docs', paths.docsBasePath)
  applyPublicRouteBasePath(artifactDir, 'guides', 'posts')
  applyPublicRouteBasePath(artifactDir, 'projects', paths.networkBasePath)
  applyCategoryRoutePaths(artifactDir)
}

export function applyLegacyRootListingRedirects(
  artifactDir: string,
  input: LegacyRootListingRedirectInput
): void {
  const legacySlugs = getSiteRootListingAliases(input.siteId)

  if (!legacySlugs?.length) {
    return
  }

  const normalizedListingBasePath = input.listingBasePath.replace(/^\/+|\/+$/g, '')

  for (const slug of legacySlugs) {
    const destinationPath = `/${normalizedListingBasePath}/${slug}/`
    const targetListingPath = resolve(artifactDir, normalizedListingBasePath, slug, 'index.html')

    if (!existsSync(targetListingPath)) {
      continue
    }

    const redirectPagePath = resolve(artifactDir, slug, 'index.html')
    removeArtifactPath(resolve(artifactDir, slug))
    mkdirSync(dirname(redirectPagePath), { recursive: true })
    writeFileSync(redirectPagePath, buildStaticRedirectHtml(destinationPath))
  }
}

export function removeUnsuffixedListingDetailArtifacts(
  artifactDir: string,
  input: { listingBasePath: string; listingDetailSuffix?: string }
): void {
  const suffix = input.listingDetailSuffix?.replace(/^\/+|\/+$/g, '')

  if (!suffix) {
    return
  }

  const listingRoot = resolve(artifactDir, input.listingBasePath.replace(/^\/+|\/+$/g, ''))

  if (!existsSync(listingRoot)) {
    return
  }

  for (const entry of readdirSync(listingRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const directIndexPath = resolve(listingRoot, entry.name, 'index.html')
    const suffixedIndexPath = resolve(listingRoot, entry.name, suffix, 'index.html')

    if (!existsSync(directIndexPath) || !existsSync(suffixedIndexPath)) {
      continue
    }

    removeArtifactRouteIndex(resolve(listingRoot, entry.name))
  }
}

function pruneArtifactTree(path: string): void {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = resolve(path, entry.name)

    if (entry.isDirectory()) {
      pruneArtifactTree(entryPath)
      continue
    }

    if (entry.name === '.DS_Store') {
      rmSync(entryPath, { force: true })
      continue
    }

    if (entry.name.endsWith('.map')) {
      rmSync(entryPath, { force: true })
      continue
    }

    if (entry.name.startsWith('__next') && entry.name.endsWith('.txt')) {
      rmSync(entryPath, { force: true })
      continue
    }

    if (entry.name === 'index.txt') {
      rmSync(entryPath, { force: true })
    }
  }
}

export function pruneStaticArtifactDir(artifactDir: string, flags: ArtifactSurfaceFlags): void {
  pruneArtifactTree(artifactDir)

  removeArtifactPath(resolve(artifactDir, '_not-found'))
  removeArtifactPath(resolve(artifactDir, '404'))
  removeArtifactPath(resolve(artifactDir, 'operator'))

  if (!flags.showAuth) {
    removeArtifactPath(resolve(artifactDir, 'account'))
    removeArtifactPath(resolve(artifactDir, 'login'))
  }

  if (!flags.showFavorites) {
    removeArtifactPath(resolve(artifactDir, 'favorites'))
  }

  if (!flags.showProjects) {
    removeArtifactPath(resolve(artifactDir, 'projects'))
  }

  if (!flags.showBrands) {
    removeArtifactPath(resolve(artifactDir, 'brands'))
  }

  if (!flags.showDocs) {
    removeArtifactPath(resolve(artifactDir, 'docs'))
  }

  if (!flags.showGuides) {
    removeArtifactPath(resolve(artifactDir, 'guides'))
    if (!flags.preservePostsRoute) {
      removeArtifactPath(resolve(artifactDir, 'posts'))
    }
  }
}

function finalizeArtifactDir(input: SiteInputTarget): void {
  const definition = loadCheckedInSiteFromInput(input)
  const appOutDir = resolveSiteAppOutDir(definition)
  const artifactDir = resolveSiteArtifactDir(definition)
  const legacySlugs = getSiteRootListingAliases(definition.id)
  const notFoundSourcePath = resolve(appOutDir, '_not-found/index.html')
  const notFoundTargetPath = resolve(artifactDir, '404.html')
  const noJekyllPath = resolve(artifactDir, '.nojekyll')
  const cnamePath = resolve(artifactDir, 'CNAME')
  const artifactFlags = {
    preservePostsRoute: definition.sitemap.staticPagePaths?.includes('/posts') ?? false,
    showAuth: definition.features.showAuth,
    showBrands: definition.features.showBrands,
    showDocs: definition.features.showDocs,
    showFavorites: definition.features.showFavorites,
    showGuides: definition.features.showGuides,
    showProjects: definition.features.showProjects
  }
  const artifactExcludedPaths =
    definition.sitemap.artifactExcludedPaths ?? definition.sitemap.excludedPaths ?? []

  rmSync(artifactDir, { force: true, recursive: true })
  mkdirSync(dirname(artifactDir), { recursive: true })
  copyDeployableStaticArtifactFiles(appOutDir, artifactDir, {
    artifactExcludedPaths,
    artifactFlags,
    brandsBasePath: definition.routes.brandsBasePath,
    categoryBasePath: definition.sitemap.categoryBasePath,
    docsBasePath: definition.routes.docsBasePath,
    listingBasePath: definition.routes.listingBasePath,
    listingDetailSuffix: definition.sitemap.listingDetailSuffix,
    networkBasePath: definition.routes.networkBasePath
  })

  if (existsSync(notFoundSourcePath)) {
    copyFileSync(notFoundSourcePath, notFoundTargetPath)
  }

  pruneStaticArtifactDir(artifactDir, artifactFlags)
  applyConfiguredPublicRoutePaths(artifactDir, {
    brandsBasePath: definition.routes.brandsBasePath,
    docsBasePath: definition.routes.docsBasePath,
    listingBasePath: definition.routes.listingBasePath,
    networkBasePath: definition.routes.networkBasePath
  })
  removeUnsuffixedListingDetailArtifacts(artifactDir, {
    listingBasePath: definition.routes.listingBasePath,
    listingDetailSuffix: definition.sitemap.listingDetailSuffix
  })
  if (definition.sitemap.categoryBasePath) {
    removeArtifactPath(resolve(artifactDir, 'categories'))
  }
  applyLegacyRootListingRedirects(artifactDir, {
    listingBasePath: definition.routes.listingBasePath,
    siteId: definition.id
  })
  removeExcludedStaticArtifactPaths(artifactDir, artifactExcludedPaths)
  writeSplitSitemaps(artifactDir, {
    additionalPathsByGroup: definition.sitemap.additionalPathsByGroup,
    baseUrl: definition.site.publicUrl,
    categoryBasePath: definition.sitemap.categoryBasePath,
    excludedPaths: [
      ...legacySlugs.map(slug => `/${slug}`),
      ...(definition.sitemap.excludedPaths ?? [])
    ],
    indexGroupOrder: definition.sitemap.indexGroupOrder,
    listingDetailSuffix: definition.sitemap.listingDetailSuffix,
    listingBasePath: definition.routes.listingBasePath,
    sitemapPathByGroup: definition.sitemap.pathByGroup,
    staticPagePaths: definition.sitemap.staticPagePaths
  })

  closeSync(openSync(noJekyllPath, 'w'))
  writeFileSync(cnamePath, `${definition.site.domain}\n`)
}

export async function runBuildSite(input: SiteInputTarget): Promise<void> {
  const definition = loadCheckedInSiteFromInput(input)
  const appPackageName = resolveSiteAppPackageName(definition)
  const sourceAppPaths = resolveBuildSourceAppPaths({
    appOutDir: resolveSiteAppOutDir(definition),
    workspaceRoot
  })
  validateSite(input)
  const env = {
    ...process.env,
    ...buildSiteEnvironment(definition),
    STATIC_EXPORT: 'true',
    WEBSITE_DATA_PATH: definition.content.listingSource.outputPath
  }

  const sourceState = prepareSourceData(input)
  const searchIndexState = prepareSearchIndex(input, env)
  const brandAssetState = await prepareBrandAssets(input)
  const routeState = prepareDisabledRoutesForStaticExport(input)

  if (existsSync(sourceAppPaths.authRoutePath)) {
    renameSync(sourceAppPaths.authRoutePath, sourceAppPaths.authRouteBackupPath)
  }
  if (existsSync(sourceAppPaths.operatorOnboardingPagePath)) {
    renameSync(
      sourceAppPaths.operatorOnboardingPagePath,
      sourceAppPaths.operatorOnboardingPageBackupPath
    )
  }

  try {
    run('pnpm', ['--filter', appPackageName, 'build'], env)
    finalizeArtifactDir(input)
  } finally {
    if (existsSync(sourceAppPaths.operatorOnboardingPageBackupPath)) {
      renameSync(
        sourceAppPaths.operatorOnboardingPageBackupPath,
        sourceAppPaths.operatorOnboardingPagePath
      )
    }
    if (existsSync(sourceAppPaths.authRouteBackupPath)) {
      renameSync(sourceAppPaths.authRouteBackupPath, sourceAppPaths.authRoutePath)
    }
    routeState.restore()
    brandAssetState.restore()
    searchIndexState.restore()
    sourceState.restore()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const input = parseSiteInputArgs(process.argv.slice(2))
  runBuildSite(input).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
