import { parseBuildInputArgs } from './build-spec.ts'
import { runBuildSite } from './build-site.ts'

runBuildSite(parseBuildInputArgs(process.argv.slice(2)))
