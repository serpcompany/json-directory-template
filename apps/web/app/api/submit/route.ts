import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateToken } from '@/lib/submission-token';
import { readSubmissions, writeSubmissions } from '@/lib/submissions-store';

const SubmitBodySchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
  category: z.string().min(1),
  description: z.string().min(1),
  content: z.string().optional().default(''),
  resourceLinks: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })).optional().default([]),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, website, category, description, content, resourceLinks } = parsed.data;
  const token = generateToken(website);

  const pending = await readSubmissions('pending');

  // Idempotent: return existing token if already submitted
  const existing = pending.find((s) => s.token === token);
  if (existing) {
    return NextResponse.json({ token });
  }

  const submission = {
    token,
    name,
    website,
    category,
    description,
    content,
    resourceLinks,
    submittedAt: new Date().toISOString(),
    verifyAttempts: 0,
  };

  await writeSubmissions('pending', [...pending, submission]);

  return NextResponse.json({ token });
}
