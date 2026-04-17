import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  searchIndexSchema,
  type SearchIndexEntry,
} from '@thedaviddias/web-core/search-index';

interface SearchSourceEntry {
  category?: string;
  categories?: string[];
  content?: string;
  description?: string;
  name?: string;
  slug?: string;
  url?: string;
  website?: string;
  domain?: string;
}

function normalizeCategories(
  category?: string,
  categories?: string[]
): string[] {
  const normalizedCategories = [
    ...(category ? [category] : []),
    ...(categories || []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(normalizedCategories)];
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

function normalizeListingBasePath(listingBasePath: string): string {
  return `/${listingBasePath.replace(/^\/+|\/+$/g, '')}`;
}

export function buildSearchIndex(
  entries: SearchSourceEntry[],
  listingBasePath: string
): SearchIndexEntry[] {
  const normalizedListingBasePath = normalizeListingBasePath(listingBasePath);

  const searchIndex = entries
    .map((entry) => {
      const slug = entry.slug || slugifyName(String(entry.name || ''));
      const categories = normalizeCategories(entry.category, entry.categories);
      const primaryCategory = categories[0] || entry.category || '';

      return {
        category: primaryCategory,
        categories,
        content: entry.content || '',
        description: entry.description || '',
        name: entry.name || '',
        slug,
        url: entry.url || `${normalizedListingBasePath}/${slug}`,
        website: entry.website || entry.domain || '',
      };
    })
    .filter((entry) => entry.name && entry.slug)
    .sort((left, right) => left.name.localeCompare(right.name));

  return searchIndexSchema.parse(searchIndex);
}

function loadSearchSourceEntries(inputPath: string): SearchSourceEntry[] {
  if (!existsSync(inputPath)) {
    throw new Error(`Website data file not found: ${inputPath}`);
  }

  const parsed = JSON.parse(readFileSync(inputPath, 'utf8')) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array in ${inputPath}`);
  }

  return parsed as SearchSourceEntry[];
}

function writeSearchIndex(
  outputPath: string,
  searchIndex: SearchIndexEntry[]
): void {
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, `${JSON.stringify(searchIndex, null, 2)}\n`);
}

export function main(): void {
  const inputPath = process.env.WEBSITE_DATA_PATH || 'data/listings.json';
  const outputPath =
    process.env.SEARCH_INDEX_OUTPUT_PATH ||
    'apps/web/public/search/search-index.json';
  const listingBasePath = process.env.LISTING_ROUTE_BASE_PATH || 'listing';

  const sourceEntries = loadSearchSourceEntries(inputPath);
  const searchIndex = buildSearchIndex(sourceEntries, listingBasePath);

  writeSearchIndex(outputPath, searchIndex);

  console.log(
    `Search index generated with ${searchIndex.length} entries at ${outputPath}`
  );
}

const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentScriptPath) {
  main();
}
