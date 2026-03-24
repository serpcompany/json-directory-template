import { parseSiteInputArgs } from './site-config.ts';
import { runBuildSite } from './build-site.ts';

await runBuildSite(parseSiteInputArgs(process.argv.slice(2)));
