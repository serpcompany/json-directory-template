import { type NextRequest, NextResponse } from 'next/server';
import { readSubmissions } from '@/lib/submissions-store';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const pending = await readSubmissions('pending');
  const submission = pending.find((s) => s.token === token);

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ name: submission.name, website: submission.website });
}
