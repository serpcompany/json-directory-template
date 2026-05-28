import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateToken } from '@/lib/submission-token'
import { readSubmissions, writeSubmissions } from '@/lib/submissions-store'

const OptionalUrlSchema = z
  .string()
  .trim()
  .refine(value => !value || z.string().url().safeParse(value).success)

const SubmitBodySchema = z
  .object({
    category: z.string().min(1),
    content: z.string().min(1),
    description: z.string().min(1),
    faqs: z
      .array(
        z.object({
          answer: z.string(),
          question: z.string()
        })
      )
      .optional()
      .default([]),
    logoUrl: z.string().url(),
    name: z.string().min(1),
    resourceLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string()
        })
      )
      .optional()
      .default([]),
    videoUrl: OptionalUrlSchema.optional().default(''),
    website: z.string().url()
  })
  .superRefine((body, context) => {
    body.faqs.forEach((faq, index) => {
      const hasQuestion = Boolean(faq.question.trim())
      const hasAnswer = Boolean(faq.answer.trim())

      if (hasQuestion !== hasAnswer) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FAQ rows require both question and answer',
          path: ['faqs', index]
        })
      }
    })
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

  const { category, content, description, faqs, logoUrl, name, resourceLinks, videoUrl, website } =
    parsed.data
  const filteredFaqs = faqs
    .filter(faq => faq.question.trim() && faq.answer.trim())
    .map(faq => ({
      answer: faq.answer.trim(),
      question: faq.question.trim()
    }))
  const filteredResourceLinks = resourceLinks
    .filter(link => link.label.trim() && link.url.trim())
    .map(link => ({
      label: link.label.trim(),
      url: link.url.trim()
    }))
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
    faqs: filteredFaqs,
    logoUrl,
    name,
    resourceLinks: filteredResourceLinks,
    submittedAt: new Date().toISOString(),
    token,
    videoUrl,
    verifyAttempts: 0,
    website
  }

  await writeSubmissions('pending', [...pending, submission])

  return NextResponse.json({ token })
}
