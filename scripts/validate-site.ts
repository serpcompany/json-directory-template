import { readFileSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget,
} from './site-config.ts';
import { createRunTempDir } from './run-context.ts';
import { writeTrialWebsiteEntries } from './trial-build.ts';
import {
  getActiveCategories,
  getUnknownCategorySlugs,
} from '@thedaviddias/web-core/category-navigation';
import {
  normalizeJsonWebsite,
  websiteJsonEntriesSchema,
} from '@thedaviddias/web-core/website-schema';

const workspaceRoot = resolve(process.cwd());

function getCategoryFixHint(
  siteId: string,
  listingSource: ReturnType<
    typeof loadCheckedInSiteFromInput
  >['content']['listingSource']
): string {
  if (listingSource.kind === 'trial-products-json') {
    const configPath =
      siteId === 'default'
        ? 'sites/site-config.default.ts'
        : `sites/${siteId}/site-config.ts`;

    return `Update content.listingSource.category in ${configPath} or add the slug to sites/${siteId}/categories.json.`;
  }

  return `Update the category values in ${listingSource.path} or add the slug to sites/${siteId}/categories.json.`;
}

export function validateSite(input: SiteInputTarget): void {
  const definition = loadCheckedInSiteFromInput(input);
  const runTempDir = createRunTempDir('validate-site', definition.id);
  const validateDir = runTempDir.path;
  const validatePath = resolve(validateDir, 'listings.json');

  try {
    mkdirSync(dirname(validatePath), { recursive: true });

    if (definition.content.listingSource.kind === 'trial-products-json') {
      writeTrialWebsiteEntries(
        definition.content.listingSource.path,
        validatePath,
        {
          category: definition.content.listingSource.category,
          featuredCount: definition.content.listingSource.featuredCount,
          publishedAt: definition.content.listingSource.publishedAt,
        }
      );
    } else {
      writeFileSync(
        validatePath,
        readFileSync(
          resolve(workspaceRoot, definition.content.listingSource.path)
        )
      );
    }

    const parsed = JSON.parse(readFileSync(validatePath, 'utf8')) as unknown;
    const result = websiteJsonEntriesSchema.safeParse(parsed);

    if (!result.success) {
      const details = result.error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
          return `[${path}] ${issue.message}`;
        })
        .join('\n');

      throw new Error(
        `Validation failed for site ${definition.id}\n${details}`
      );
    }

    console.log(
      `Valid site data for ${definition.id} — ${result.data.length} entries`
    );

    const normalizedListings = result.data.map(normalizeJsonWebsite);
    const unknownCategorySlugs = getUnknownCategorySlugs(
      normalizedListings,
      definition.id
    );

    if (unknownCategorySlugs.length > 0) {
      throw new Error(
        [
          `Validation failed for site ${definition.id}`,
          `Unknown category slugs: ${unknownCategorySlugs.join(', ')}`,
          getCategoryFixHint(definition.id, definition.content.listingSource),
        ].join('\n')
      );
    }

    const activeCategories = getActiveCategories(
      normalizedListings,
      definition.id
    );
    console.log(
      `Active categories for ${definition.id}: ${activeCategories
        .map((category) => category.slug)
        .join(', ')}`
    );
  } finally {
    runTempDir.cleanup();
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  try {
    validateSite(parseSiteInputArgs(process.argv.slice(2)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
