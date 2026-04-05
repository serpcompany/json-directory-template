// Usage:
//   pnpm submissions list-pending
//   pnpm submissions list-verified
//   pnpm submissions publish <token>

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  PendingSubmission,
  VerifiedSubmission,
} from '../sites/submission-schema.ts';

const DATA_DIR = join(process.cwd(), 'data');
const PENDING_PATH = join(DATA_DIR, 'submissions-pending.json');
const VERIFIED_PATH = join(DATA_DIR, 'submissions-verified.json');
const LISTINGS_PATH = join(DATA_DIR, 'listings.json');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function tokenToSlug(token: string): string {
  // token is already url-safe; use it directly as slug
  return token;
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len - 1) + ' ' : str.padEnd(len);
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function listPending(): void {
  const submissions = readJson<PendingSubmission[]>(PENDING_PATH);

  if (submissions.length === 0) {
    console.log('No pending submissions.');
    return;
  }

  const COL = [22, 22, 34, 12];
  const header = [
    padRight('Token', COL[0]),
    padRight('Name', COL[1]),
    padRight('Website', COL[2]),
    padRight('Submitted', COL[3]),
  ].join('');

  console.log(header);
  console.log('-'.repeat(COL[0] + COL[1] + COL[2] + COL[3]));

  for (const s of submissions) {
    console.log(
      [
        padRight(s.token, COL[0]),
        padRight(s.name, COL[1]),
        padRight(s.website, COL[2]),
        padRight(formatDate(s.submittedAt), COL[3]),
      ].join('')
    );
  }
}

function listVerified(): void {
  const submissions = readJson<VerifiedSubmission[]>(VERIFIED_PATH);

  if (submissions.length === 0) {
    console.log('No verified submissions.');
    return;
  }

  const COL = [22, 22, 34, 12, 12];
  const header = [
    padRight('Token', COL[0]),
    padRight('Name', COL[1]),
    padRight('Website', COL[2]),
    padRight('Verified', COL[3]),
    padRight('Published', COL[4]),
  ].join('');

  console.log(header);
  console.log('-'.repeat(COL[0] + COL[1] + COL[2] + COL[3] + COL[4]));

  for (const s of submissions) {
    console.log(
      [
        padRight(s.token, COL[0]),
        padRight(s.name, COL[1]),
        padRight(s.website, COL[2]),
        padRight(formatDate(s.verifiedAt), COL[3]),
        padRight(s.publishedAt ? formatDate(s.publishedAt) : '—', COL[4]),
      ].join('')
    );
  }
}

function publish(token: string | undefined): void {
  if (!token) {
    console.error('Usage: submissions publish <token>');
    process.exit(1);
  }

  const verified = readJson<VerifiedSubmission[]>(VERIFIED_PATH);
  const idx = verified.findIndex((s) => s.token === token);

  if (idx === -1) {
    console.error('No verified submission with that token.');
    process.exit(1);
  }

  const submission = verified[idx];

  if (submission.publishedAt) {
    console.error('Already published.');
    process.exit(1);
  }

  const listings = readJson<Record<string, unknown>[]>(LISTINGS_PATH);

  const listing = {
    slug: tokenToSlug(submission.token),
    name: submission.name,
    website: submission.website,
    description: submission.description,
    category: submission.category,
    categories: [submission.category],
    publishedAt: new Date().toISOString().slice(0, 10),
  };

  listings.push(listing);
  writeJson(LISTINGS_PATH, listings);

  verified[idx] = {
    ...submission,
    publishedAt: new Date().toISOString(),
  };
  writeJson(VERIFIED_PATH, verified);

  console.log(`✅ Published: "${submission.name}" → data/listings.json`);
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list-pending':
    listPending();
    break;
  case 'list-verified':
    listVerified();
    break;
  case 'publish':
    publish(arg);
    break;
  default:
    console.log(
      'Usage: submissions <list-pending|list-verified|publish <token>>'
    );
}
