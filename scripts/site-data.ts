import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget,
} from './site-config.ts';
import { writeTrialWebsiteEntries } from './trial-build.ts';

const workspaceRoot = resolve(process.cwd());

function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

export type PreparedSiteData = {
  outputPath: string;
  outputPathDisplay: string;
  siteId: string;
  sourceKind: string;
  sourcePathDisplay: string;
};

export function prepareSiteData(input: SiteInputTarget): PreparedSiteData {
  const definition = loadCheckedInSiteFromInput(input);
  const sourcePlan = definition.content.listingSource;
  const outputPath = resolve(workspaceRoot, sourcePlan.outputPath);

  ensureParentDir(outputPath);

  if (sourcePlan.kind === 'trial-products-json') {
    writeTrialWebsiteEntries(sourcePlan.path, sourcePlan.outputPath, {
      category: sourcePlan.category,
      featuredCount: sourcePlan.featuredCount,
      publishedAt: sourcePlan.publishedAt,
    });
  } else {
    const sourcePath = resolve(workspaceRoot, sourcePlan.path);

    if (sourcePath !== outputPath) {
      writeFileSync(outputPath, readFileSync(sourcePath));
    }
  }

  return {
    outputPath,
    outputPathDisplay: sourcePlan.outputPath,
    siteId: definition.id,
    sourceKind: sourcePlan.kind,
    sourcePathDisplay: sourcePlan.path,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const prepared = prepareSiteData(parseSiteInputArgs(process.argv.slice(2)));
  console.log(`Prepared listing data for ${prepared.siteId}`);
  console.log(`Source: ${prepared.sourcePathDisplay} (${prepared.sourceKind})`);
  console.log(`Output: ${prepared.outputPathDisplay}`);
}
