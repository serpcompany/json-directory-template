import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getUnknownCategorySlugs } from '@thedaviddias/web-core/category-navigation';
import {
  normalizeJsonWebsite,
  parseJsonWebsiteEntries,
} from '@thedaviddias/web-core/website-schema';

export function validateListingData(
  parsed: unknown,
  sourceLabel = 'data/listings.json'
): number {
  const entries = parseJsonWebsiteEntries(parsed);
  const normalizedListings = entries.map(normalizeJsonWebsite);
  const unknownCategorySlugs = getUnknownCategorySlugs(normalizedListings);

  if (unknownCategorySlugs.length > 0) {
    throw new Error(
      [
        `Validation failed for ${sourceLabel}`,
        `Unknown category slugs: ${unknownCategorySlugs.join(', ')}`,
        'Update the category values or add the slug to packages/web-core/src/categories.ts.',
      ].join('\n')
    );
  }

  return entries.length;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const dataPath = resolve(process.cwd(), process.argv[2] || 'data/listings.json');

  console.log(`Validating: ${dataPath}`);

  let raw: string;
  try {
    raw = readFileSync(dataPath, 'utf-8');
  } catch {
    console.error(`Failed to read ${dataPath}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('Invalid JSON');
    process.exit(1);
  }

  try {
    const count = validateListingData(parsed, dataPath);
    console.log(`Valid — ${count} entries`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n${message}`);
    process.exit(1);
  }
}
