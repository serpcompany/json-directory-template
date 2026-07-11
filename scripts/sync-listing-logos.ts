import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  resolveSiteAppOutDir,
  type SiteInputTarget,
} from './site-config.ts';

type LogoSourceManifestEntry = {
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
  productPage?: string;
  slug: string;
  sourceUrl: string | null;
  title?: string;
};

type SyncListingLogosOptions = {
  fetchImpl?: typeof fetch;
  manifestPath: string;
};

const contentTypeExtensions = new Map<string, string>([
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/svg+xml', '.svg'],
  ['image/webp', '.webp'],
  ['image/x-icon', '.ico'],
]);

function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function resolveManifestArg(argv: string[]): string {
  const manifestFlagIndex = argv.findIndex(
    (argument) => argument === '--manifest'
  );

  const manifestPath = manifestFlagIndex >= 0 ? argv[manifestFlagIndex + 1] : '';

  if (!manifestPath) {
    throw new Error(
      'sync-listing-logos requires --manifest <path-to-logo-source-manifest>.'
    );
  }

  return manifestPath;
}

function parseManifest(path: string): LogoSourceManifestEntry[] {
  const parsed = JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error('Logo source manifest must be a JSON array.');
  }

  return parsed.map((entry) => ({
    confidence: entry.confidence,
    notes: entry.notes,
    productPage: entry.productPage,
    slug: String(entry.slug),
    sourceUrl:
      typeof entry.sourceUrl === 'string' ? entry.sourceUrl : entry.sourceUrl,
    title: entry.title,
  }));
}

function resolveLogoExtension(
  sourceUrl: string,
  contentTypeHeader: string | null
): string {
  const normalizedContentType = contentTypeHeader
    ?.split(';')[0]
    .trim()
    .toLowerCase();

  if (normalizedContentType) {
    const contentTypeExtension = contentTypeExtensions.get(normalizedContentType);

    if (contentTypeExtension) {
      return contentTypeExtension;
    }
  }

  const pathnameExtension = extname(new URL(sourceUrl).pathname).toLowerCase();

  if (pathnameExtension) {
    return pathnameExtension;
  }

  return '.png';
}

export async function syncListingLogos(
  input: SiteInputTarget,
  options: SyncListingLogosOptions
): Promise<{
  manifestPathDisplay: string;
  outputDirDisplay: string;
  siteId: string;
  sourcePathDisplay: string;
  syncedCount: number;
}> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const definition = loadCheckedInSiteFromInput(input);

  if (definition.content.listingSource.kind === 'd1-listings') {
    throw new Error(
      `Listing logo sync currently supports file-backed listing sources. ${definition.id} uses d1-listings.`
    );
  }

  const sourcePath = definition.content.listingSource.path;
  const sourceFilePath = resolve(process.cwd(), sourcePath);
  const manifestEntries = parseManifest(options.manifestPath);
  const products = JSON.parse(readFileSync(sourceFilePath, 'utf8')) as Record<
    string,
    Record<string, unknown>
  >;
  const appDir = dirname(resolveSiteAppOutDir(definition));
  const outputDir = `${appDir}/public/listing-logos/${definition.id}`;
  const absoluteOutputDir = resolve(process.cwd(), outputDir);

  mkdirSync(absoluteOutputDir, { recursive: true });

  let syncedCount = 0;

  for (const entry of manifestEntries) {
    if (!entry.sourceUrl) {
      continue;
    }

    const response = await fetchImpl(entry.sourceUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download logo for ${entry.slug} from ${entry.sourceUrl}: ${response.status} ${response.statusText}`
      );
    }

    const extension = resolveLogoExtension(
      entry.sourceUrl,
      response.headers.get('content-type')
    );
    const outputPath = resolve(absoluteOutputDir, `${entry.slug}${extension}`);

    ensureParentDir(outputPath);
    writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));

    const currentProduct = products[entry.slug];

    if (!currentProduct) {
      throw new Error(
        `Logo manifest entry "${entry.slug}" does not exist in ${sourcePath}.`
      );
    }

    const currentMedia =
      typeof currentProduct.media === 'object' && currentProduct.media
        ? (currentProduct.media as Record<string, unknown>)
        : {};

    currentProduct.media = {
      ...currentMedia,
      logo: `/listing-logos/${definition.id}/${entry.slug}${extension}`,
    };
    syncedCount += 1;
  }

  writeFileSync(sourceFilePath, `${JSON.stringify(products, null, 2)}\n`);

  return {
    manifestPathDisplay: options.manifestPath,
    outputDirDisplay: outputDir,
    siteId: definition.id,
    sourcePathDisplay: sourcePath,
    syncedCount,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const manifestPath = resolveManifestArg(args);
  const input = parseSiteInputArgs(args);
  const result = await syncListingLogos(input, {
    manifestPath,
  });

  console.log(`Synced ${result.syncedCount} listing logos for ${result.siteId}`);
  console.log(`Source: ${result.sourcePathDisplay}`);
  console.log(`Manifest: ${result.manifestPathDisplay}`);
  console.log(`Output: ${result.outputDirDisplay}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
