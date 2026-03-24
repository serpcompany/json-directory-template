import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { loadCheckedInSiteFromInput, parseSiteInputArgs } from './site-config.ts'

export function resolveBuildRun(argv: string[], env: NodeJS.ProcessEnv = process.env): {
  artifactDir: string
  siteId: string
} {
  const input = parseSiteInputArgs(argv, env)
  const definition = loadCheckedInSiteFromInput(input)

  return {
    artifactDir: definition.build.artifactDir,
    siteId: definition.id
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const run = resolveBuildRun(process.argv.slice(2))
  console.log(`artifact_dir=${run.artifactDir}`)
  console.log(`site_id=${run.siteId}`)
}
