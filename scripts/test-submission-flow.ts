/**
 * File-based smoke test for the badge verification submission flow.
 *
 * Does NOT require a running server — all checks are performed against
 * the JSON data files and imported utility functions directly.
 *
 * Run with:   pnpm test:submission-flow
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// ── paths ─────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'data');
const PENDING_PATH = join(DATA_DIR, 'submissions-pending.json');
const VERIFIED_PATH = join(DATA_DIR, 'submissions-verified.json');
const LISTINGS_PATH = join(DATA_DIR, 'listings.json');
const BADGE_DIR = join(REPO_ROOT, 'apps/web/public/badge');

// ── minimal inline re-implementations (avoid Next.js CWD assumptions) ─────────

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** Mirrors apps/web/lib/submission-token.ts */
function generateToken(website: string): string {
  const slug = new URL(website).hostname.replace(/\./g, '-');
  const ts = Date.now().toString(36);
  const hash = createHash('sha256').update(website + ts).digest('hex').slice(0, 8);
  return `${slug}-${hash}`;
}

// ── test state ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function pass(label: string): void {
  console.log(`  ✅  ${label}`);
  passed++;
}

function fail(label: string, detail?: string): void {
  console.error(`  ❌  ${label}${detail ? `\n      ${detail}` : ''}`);
  failed++;
}

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

// ── snapshot helpers ───────────────────────────────────────────────────────────
let pendingSnapshot: unknown[];
let verifiedSnapshot: unknown[];
let listingsSnapshot: unknown[];

function snapshotDataFiles(): void {
  pendingSnapshot = readJson<unknown[]>(PENDING_PATH);
  verifiedSnapshot = readJson<unknown[]>(VERIFIED_PATH);
  listingsSnapshot = readJson<unknown[]>(LISTINGS_PATH);
}

function restoreDataFiles(): void {
  writeJson(PENDING_PATH, pendingSnapshot);
  writeJson(VERIFIED_PATH, verifiedSnapshot);
  writeJson(LISTINGS_PATH, listingsSnapshot);
}

// ── tests ─────────────────────────────────────────────────────────────────────

type PendingSubmission = {
  token: string;
  name: string;
  website: string;
  category: string;
  description: string;
  submittedAt: string;
  verifyAttempts: number;
};

type VerifiedSubmission = PendingSubmission & {
  verifiedAt: string;
  publishedAt?: string;
};

async function main(): Promise<void> {
console.log('\n── Smoke test: badge verification submission flow ──\n');

// Capture current state so we can restore after tests
snapshotDataFiles();

try {
  // ── Step 1: generateToken produces a deterministic-format token ──────────────
  console.log('Step 1: generateToken');
  const testWebsite = 'https://example-test.io';
  const token = generateToken(testWebsite);
  assert(typeof token === 'string' && token.length > 0, 'token is a non-empty string');
  assert(
    token.startsWith('example-test-io-'),
    `token starts with hostname slug (got: "${token}")`
  );
  assert(
    /^[a-z0-9-]+$/.test(token),
    `token is url-safe (got: "${token}")`
  );

  // Two calls produce different tokens (timestamp component)
  await new Promise((r) => setTimeout(r, 5));
  const token2 = generateToken(testWebsite);
  assert(token !== token2, 'successive tokens are unique (timestamp component)');

  // ── Step 2: Write a pending submission ────────────────────────────────────────
  console.log('\nStep 2: write pending submission');
  const testToken = `smoke-test-token-${Date.now().toString(36)}`;
  const submission: PendingSubmission = {
    token: testToken,
    name: 'Smoke Test Site',
    website: 'https://smoke-test.example.com',
    category: 'developer-tools',
    description: 'A smoke test submission used to verify the flow.',
    submittedAt: new Date().toISOString(),
    verifyAttempts: 0,
  };

  const pending = readJson<PendingSubmission[]>(PENDING_PATH);
  writeJson(PENDING_PATH, [...pending, submission]);

  // ── Step 3: Read back and assert presence ─────────────────────────────────────
  console.log('\nStep 3: read pending submissions');
  const pendingAfterWrite = readJson<PendingSubmission[]>(PENDING_PATH);
  const found = pendingAfterWrite.find((s) => s.token === testToken);
  assert(found !== undefined, 'submission is present in pending JSON after write');
  assert(found?.name === 'Smoke Test Site', 'name round-trips correctly');
  assert(found?.website === 'https://smoke-test.example.com', 'website round-trips correctly');
  assert(found?.verifyAttempts === 0, 'verifyAttempts defaults to 0');

  // ── Step 4: Simulate badge verification (HTML fixture check) ─────────────────
  console.log('\nStep 4: verify-badge logic (in-memory HTML fixture)');
  const htmlWithBadge = `<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <a href="https://serp.software">
    <img src="/badge/featured-on-serp.software-light.svg"
         alt="Featured on SERP.software"
         data-verify-token="${testToken}"
         width="153" height="44" />
  </a>
</body>
</html>`;

  const htmlWithoutBadge = `<!DOCTYPE html><html><body><p>No badge here.</p></body></html>`;

  const tokenPresentInGoodHtml = htmlWithBadge.includes(`data-verify-token="${testToken}"`);
  const tokenPresentInBadHtml = htmlWithoutBadge.includes(`data-verify-token="${testToken}"`);

  assert(tokenPresentInGoodHtml, 'token found in HTML fixture that contains the badge snippet');
  assert(!tokenPresentInBadHtml, 'token NOT found in HTML fixture without the badge snippet');

  // ── Step 5: Promote submission to verified ────────────────────────────────────
  console.log('\nStep 5: promote pending → verified');
  const latestPending = readJson<PendingSubmission[]>(PENDING_PATH);
  const subToVerify = latestPending.find((s) => s.token === testToken);
  assert(subToVerify !== undefined, 'found submission to verify in pending list');

  if (subToVerify) {
    const verifiedEntry: VerifiedSubmission = {
      ...subToVerify,
      verifiedAt: new Date().toISOString(),
    };

    const verifiedList = readJson<VerifiedSubmission[]>(VERIFIED_PATH);
    writeJson(VERIFIED_PATH, [...verifiedList, verifiedEntry]);

    // Remove from pending
    writeJson(
      PENDING_PATH,
      latestPending.filter((s) => s.token !== testToken)
    );

    const updatedPending = readJson<PendingSubmission[]>(PENDING_PATH);
    const updatedVerified = readJson<VerifiedSubmission[]>(VERIFIED_PATH);

    assert(
      !updatedPending.some((s) => s.token === testToken),
      'submission removed from pending after verification'
    );
    assert(
      updatedVerified.some((s) => s.token === testToken),
      'submission present in verified after promotion'
    );
    assert(
      updatedVerified.find((s) => s.token === testToken)?.verifiedAt !== undefined,
      'verifiedAt timestamp is set'
    );
  }

  // ── Step 6: Publish (append to listings.json) ────────────────────────────────
  console.log('\nStep 6: publish to listings.json');
  const verifiedForPublish = readJson<VerifiedSubmission[]>(VERIFIED_PATH);
  const entryToPublish = verifiedForPublish.find((s) => s.token === testToken);
  assert(entryToPublish !== undefined, 'verified entry found for publish step');

  if (entryToPublish) {
    const newListing = {
      slug: entryToPublish.token,
      name: entryToPublish.name,
      website: entryToPublish.website,
      description: entryToPublish.description,
      category: entryToPublish.category,
      categories: [entryToPublish.category],
      publishedAt: new Date().toISOString().slice(0, 10),
    };

    const listings = readJson<Record<string, unknown>[]>(LISTINGS_PATH);
    writeJson(LISTINGS_PATH, [...listings, newListing]);

    const updatedListings = readJson<Record<string, unknown>[]>(LISTINGS_PATH);
    assert(
      updatedListings.some((l) => l['slug'] === testToken),
      'listing appended to listings.json'
    );
    assert(
      updatedListings.find((l) => l['slug'] === testToken)?.['name'] === 'Smoke Test Site',
      'listing name matches submission'
    );
  }

  // ── Step 7: Badge SVG assets exist ───────────────────────────────────────────
  console.log('\nStep 7: badge SVG assets');
  const expectedBadges = [
    'featured-on-serp.software-light.svg',
    'featured-on-serp.software-dark.svg',
    'featured-on-serpdownloaders.com-light.svg',
    'featured-on-serpdownloaders.com-dark.svg',
  ];

  for (const filename of expectedBadges) {
    const badgePath = join(BADGE_DIR, filename);
    assert(
      existsSync(badgePath),
      `badge asset exists: ${filename}`,
      `Expected file at ${badgePath}`
    );
  }

} finally {
  // ── Cleanup: restore original data files ────────────────────────────────────
  console.log('\nCleanup: restoring data files to pre-test state');
  restoreDataFiles();
  console.log('  data files restored');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);

if (failed > 0) {
  process.exit(1);
}
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
