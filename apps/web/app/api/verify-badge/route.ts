import { type NextRequest, NextResponse } from 'next/server';
import { readSubmissions, writeSubmissions } from '../../../lib/submissions-store';

const MAX_BODY_BYTES = 500 * 1024; // 500 KB

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

  if (submission.verifyAttempts >= 5) {
    return NextResponse.json(
      { verified: false, message: 'Too many attempts. Contact support.' },
      { status: 429 },
    );
  }

  // Increment attempt count before fetching
  await writeSubmissions(
    'pending',
    pending.map((s) => (s.token === token ? { ...s, verifyAttempts: s.verifyAttempts + 1 } : s)),
  );

  // Fetch submitter's page with size limit
  let html: string;
  try {
    const res = await fetch(submission.website, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'DirectoryVerifier/1.0' },
    });

    // Read at most 500 KB to avoid memory issues
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({
        verified: false,
        message: "Couldn't reach your site. Make sure it's publicly accessible and try again.",
      });
    }

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

    const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.byteLength, 0));
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    html = new TextDecoder().decode(combined);
  } catch {
    return NextResponse.json({
      verified: false,
      message: "Couldn't reach your site. Make sure it's publicly accessible and try again.",
    });
  }

  // Check for verification token in HTML
  const tokenPresent = html.includes(`data-verify-token="${token}"`);
  if (!tokenPresent) {
    return NextResponse.json({
      verified: false,
      message:
        'Badge not found on your site. Make sure the snippet is placed on a publicly visible page.',
    });
  }

  // Promote to verified: add to verified list and remove from pending
  try {
    const verifiedList = await readSubmissions('verified');
    await writeSubmissions('verified', [
      ...verifiedList,
      { ...submission, verifiedAt: new Date().toISOString() },
    ]);
    // Re-read pending to avoid race with the incremented attempt count we wrote above
    const latestPending = await readSubmissions('pending');
    await writeSubmissions(
      'pending',
      latestPending.filter((s) => s.token !== token),
    );
  } catch {
    return NextResponse.json(
      { verified: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ verified: true, message: 'Verified! Your submission is now in review.' });
}
