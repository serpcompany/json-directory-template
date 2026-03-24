import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { loadSiteDefinitionFromInput, parseBuildInputArgs } from './build-spec.ts'

export function resolveBuildRun(argv: string[], env: NodeJS.ProcessEnv = process.env): {
  artifactDir: string
  siteId: string
  specPath?: string
} {
  const input = parseBuildInputArgs(argv, env)
  const definition = loadSiteDefinitionFromInput(input)

  return {
    artifactDir: definition.build.artifactDir,
    siteId: definition.id,
    ...(input.specPath ? { specPath: input.specPath } : {})
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const run = resolveBuildRun(process.argv.slice(2))
  console.log(`artifact_dir=${run.artifactDir}`)
  console.log(`site_id=${run.siteId}`)

  if (run.specPath) {
    console.log(`spec_path=${run.specPath}`)
  }
}
