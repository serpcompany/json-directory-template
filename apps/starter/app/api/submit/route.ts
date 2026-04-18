import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateToken } from '@/lib/submission-token'
import { readSubmissions, writeSubmissions } from '@/lib/submissions-store'

const SubmitBodySchema = z.object({
  category: z.string().min(1),
  content: z.string().optional().default(''),
  description: z.string().min(1),
  name: z.string().min(1),
  resourceLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .optional()
    .default([]),
  website: z.string().url(),
})

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SubmitBodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { category, content, description, name, resourceLinks, website } =
    parsed.data
  const token = generateToken(website)
  const pending = await readSubmissions('pending')
  const existing = pending.find(entry => entry.token === token)

  if (existing) {
    return NextResponse.json({ token })
  }

  const submission = {
    category,
    content,
    description,
    name,
    resourceLinks,
    submittedAt: new Date().toISOString(),
    token,
    verifyAttempts: 0,
    website,
  }

  await writeSubmissions('pending', [...pending, submission])

  return NextResponse.json({ token })
}
