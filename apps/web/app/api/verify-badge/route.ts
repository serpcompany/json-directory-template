import { type NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { decode } from 'html-entities';
import { revalidatePath } from 'next/cache';
import { siteConfig } from '@/lib/site-config';
import { readSubmissions, writeSubmissions } from '@/lib/submissions-store';
import { appendListing } from '@/lib/listings-store';

const MAX_BODY_BYTES = 500 * 1024; // 500 KB

// ── helpers ────────────────────────────────────────────────────────────────────

/** Fetch page HTML, capped at MAX_BODY_BYTES. Returns null on network error. */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'DirectoryVerifier/1.0' },
    });
    const reader = res.body?.getReader();
    if (!reader) return null;

    const chunks: Uint8Array[] = [];
    let bytesRead = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytesRead += value.byteLength;
        if (bytesRead > MAX_BODY_BYTES) {
          chunks.push(value.slice(0, value.byteLength - (bytesRead - MAX_BODY_BYTES)));
          reader.cancel().catch(() => {});
          break;
        }
        chunks.push(value);
      }
    }
    const combined = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
    let offset = 0;
    for (const c of chunks) { combined.set(c, offset); offset += c.byteLength; }
    return new TextDecoder().decode(combined);
  } catch {
    return null;
  }
}

interface VerifyResult {
  hasBacklink: boolean;
  hasToken: boolean;
}

/** Pass 1 — raw HTML + cheerio (handles entity-encoded attributes too). */
function checkRawHtml(html: string, domain: string, token: string): VerifyResult {
  // Decode entities so &quot; → " before cheerio parses
  const decoded = decode(html);
  const $ = cheerio.load(decoded);

  const hasBacklink = $(`a[href*="${domain}"]`).length > 0;
  const hasToken = $(`[data-verify-token="${token}"]`).length > 0;
  return { hasBacklink, hasToken };
}

/** Pass 2 — headless Playwright for JS-rendered pages. */
async function checkRenderedDom(url: string, domain: string, token: string): Promise<VerifyResult> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

    const hasBacklink = (await page.locator(`a[href*="${domain}"]`).count()) > 0;
    const hasToken = (await page.locator(`[data-verify-token="${token}"]`).count()) > 0;

    await browser.close();
    return { hasBacklink, hasToken };
  } catch {
    return { hasBacklink: false, hasToken: false };
  }
}

// ── route ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    token = typeof body.token === 'string' ? body.token : undefined;
  } catch {
    return NextResponse.json({ verified: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ verified: false, message: 'Missing token' }, { status: 400 });
  }

  const pending = await readSubmissions('pending');
  const submission = pending.find((s) => s.token === token);
  if (!submission) {
    return NextResponse.json({ verified: false, message: 'Submission not found' }, { status: 404 });
  }


  // Use request origin in dev/staging; fall back to configured domain in prod
  const requestOrigin = req.headers.get('origin') || req.nextUrl.origin;
  const domain = requestOrigin.replace(/^https?:\/\//, '').replace(/:\d+$/, '') || siteConfig.domain;

  // Pass 1: raw HTML
  const html = await fetchHtml(submission.website);
  if (!html) {
    return NextResponse.json({
      verified: false,
      message: "Couldn't reach your site. Make sure it's publicly accessible and try again.",
    });
  }

  let result = checkRawHtml(html, domain, token);

  // Pass 2: rendered DOM fallback (only if raw HTML check failed)
  if (!result.hasBacklink) {
    result = await checkRenderedDom(submission.website, domain, token);
  }

  if (!result.hasBacklink) {
    return NextResponse.json({
      verified: false,
      message: `Backlink to ${domain} not found on your site. Add the badge snippet to a publicly visible page and try again.`,
    });
  }

  // Promote to verified
  try {
    const verifiedList = await readSubmissions('verified');
    await writeSubmissions('verified', [
      ...verifiedList,
      { ...submission, verifiedAt: new Date().toISOString() },
    ]);
    const latestPending = await readSubmissions('pending');
    await writeSubmissions('pending', latestPending.filter((s) => s.token !== token));
  } catch {
    return NextResponse.json(
      { verified: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }

  // Build slug and publish listing
  const slug = submission.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  appendListing({
    slug,
    name: submission.name,
    website: submission.website,
    description: submission.description,
    content: submission.content ?? '',
    category: submission.category,
    categories: [submission.category],
    resourceLinks: (submission.resourceLinks ?? []).filter(r => r.label.trim() && r.url.trim()),
    publishedAt: new Date().toISOString().slice(0, 10),
    featured: false,
  })
  revalidatePath('/')
  revalidatePath('/websites')
  revalidatePath(`/websites/${slug}`)

  return NextResponse.json({ verified: true, message: 'Verified! Your listing is live.', slug });
}
