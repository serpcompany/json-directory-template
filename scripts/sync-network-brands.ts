import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptPath), '..')

type NetworkBrandsPathsOptions = {
  homeDir?: string
  repoRoot?: string
}

type SyncNetworkBrandsOptions = {
  sourcePath?: string
  targetPath?: string
}

type RawNetworkBrandsData = {
  brandGroups?: unknown
  brands?: unknown
}

export function getDefaultNetworkBrandsPaths({
  homeDir = homedir(),
  repoRoot: targetRepoRoot = repoRoot
}: NetworkBrandsPathsOptions = {}) {
  return {
    sourcePath: join(
      homeDir,
      'dev',
      'repos',
      'serp',
      'docs',
      'websites',
      'pages',
      'brands.json'
    ),
    targetPath: join(targetRepoRoot, 'packages', 'web-core', 'src', 'data', 'network-brands.json')
  }
}

export function syncNetworkBrands({ sourcePath, targetPath }: SyncNetworkBrandsOptions = {}) {
  const defaults = getDefaultNetworkBrandsPaths()
  const resolvedSourcePath = sourcePath ?? defaults.sourcePath
  const resolvedTargetPath = targetPath ?? defaults.targetPath
  const parsed = readNetworkBrandsJson(resolvedSourcePath)

  mkdirSync(dirname(resolvedTargetPath), { recursive: true })
  writeFileSync(resolvedTargetPath, `${JSON.stringify(parsed, null, 2)}\n`)

  return {
    brandCount: Object.keys(parsed.brands).length,
    sourcePath: resolvedSourcePath,
    targetPath: resolvedTargetPath
  }
}

function readNetworkBrandsJson(sourcePath: string): {
  brandGroups?: unknown
  brands: Record<string, unknown>
} {
  const parsed = JSON.parse(readFileSync(sourcePath, 'utf8')) as RawNetworkBrandsData

  if (!parsed.brands || typeof parsed.brands !== 'object' || Array.isArray(parsed.brands)) {
    throw new Error(`Network brands source "${sourcePath}" must contain a brands object`)
  }

  return {
    ...parsed,
    brands: parsed.brands as Record<string, unknown>
  }
}

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

const invokedAsScript =
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === realpathSync(scriptPath)

if (invokedAsScript) {
  const result = syncNetworkBrands({
    sourcePath: readOption('--source'),
    targetPath: readOption('--target')
  })

  console.log(
    `[network-brands] synced ${result.brandCount} brands from ${result.sourcePath} to ${result.targetPath}`
  )
}
