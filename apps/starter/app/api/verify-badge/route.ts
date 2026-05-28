import { getRoute } from '@thedaviddias/web-core/routes'
import { siteConfig } from '@thedaviddias/web-core/site-config'
import * as cheerio from 'cheerio'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { appendListing } from '@/lib/listings-store'
import { readSubmissions, writeSubmissions } from '@/lib/submissions-store'

const MAX_BODY_BYTES = 500 * 1024

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'DirectoryVerifier/1.0' }
    })

    const reader = response.body?.getReader()

    if (!reader) {
      return null
    }

    const chunks: Uint8Array[] = []
    let bytesRead = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      if (value) {
        bytesRead += value.byteLength

        if (bytesRead > MAX_BODY_BYTES) {
          chunks.push(value.slice(0, value.byteLength - (bytesRead - MAX_BODY_BYTES)))
          reader.cancel().catch(() => {})
          break
        }

        chunks.push(value)
      }
    }

    const combined = new Uint8Array(chunks.reduce((count, chunk) => count + chunk.byteLength, 0))
    let offset = 0

    for (const chunk of chunks) {
      combined.set(chunk, offset)
      offset += chunk.byteLength
    }

    return new TextDecoder().decode(combined)
  } catch {
    return null
  }
}

interface VerifyResult {
  hasBacklink: boolean
  hasToken: boolean
}

function checkRawHtml(html: string, domain: string, token: string): VerifyResult {
  const decoded = decodeHtmlEntities(html)
  const $ = cheerio.load(decoded)

  return {
    hasBacklink: $(`a[href*="${domain}"]`).length > 0,
    hasToken: $(`[data-verify-token="${token}"]`).length > 0
  }
}

async function checkRenderedDom(url: string, domain: string, token: string): Promise<VerifyResult> {
  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

    const hasBacklink = (await page.locator(`a[href*="${domain}"]`).count()) > 0
    const hasToken = (await page.locator(`[data-verify-token="${token}"]`).count()) > 0

    await browser.close()

    return { hasBacklink, hasToken }
  } catch {
    return { hasBacklink: false, hasToken: false }
  }
}

export async function POST(request: NextRequest) {
  let token: string | undefined

  try {
    const body = (await request.json()) as Record<string, unknown>
    token = typeof body.token === 'string' ? body.token : undefined
  } catch {
    return NextResponse.json({ message: 'Invalid request body', verified: false }, { status: 400 })
  }

  if (!token) {
    return NextResponse.json({ message: 'Missing token', verified: false }, { status: 400 })
  }

  const pending = await readSubmissions('pending')
  const submission = pending.find(entry => entry.token === token)

  if (!submission) {
    return NextResponse.json({ message: 'Submission not found', verified: false }, { status: 404 })
  }

  const requestOrigin = request.headers.get('origin') || request.nextUrl.origin
  const domain = requestOrigin.replace(/^https?:\/\//, '').replace(/:\d+$/, '') || siteConfig.domain

  const html = await fetchHtml(submission.website)

  if (!html) {
    return NextResponse.json({
      message: "Couldn't reach your site. Make sure it's publicly accessible and try again.",
      verified: false
    })
  }

  let result = checkRawHtml(html, domain, token)

  if (!result.hasBacklink) {
    result = await checkRenderedDom(submission.website, domain, token)
  }

  if (!result.hasBacklink) {
    return NextResponse.json({
      message: `Backlink to ${domain} not found on your site. Add the badge snippet to a publicly visible page and try again.`,
      verified: false
    })
  }

  try {
    const verified = await readSubmissions('verified')

    await writeSubmissions('verified', [
      ...verified,
      { ...submission, verifiedAt: new Date().toISOString() }
    ])

    const latestPending = await readSubmissions('pending')
    await writeSubmissions(
      'pending',
      latestPending.filter(entry => entry.token !== token)
    )
  } catch {
    return NextResponse.json(
      {
        message: 'An unexpected error occurred. Please try again.',
        verified: false
      },
      { status: 500 }
    )
  }

  const slug = submission.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const media = {
    ...(submission.logoUrl ? { logo: submission.logoUrl } : {}),
    ...(submission.videoUrl ? { video: submission.videoUrl } : {})
  }

  appendListing({
    categories: [submission.category],
    category: submission.category,
    content: submission.content ?? '',
    description: submission.description,
    featured: false,
    ...(Object.keys(media).length > 0 ? { media } : {}),
    name: submission.name,
    publishedAt: new Date().toISOString().slice(0, 10),
    resourceLinks: (submission.resourceLinks ?? []).filter(
      link => link.label.trim() && link.url.trim()
    ),
    slug,
    website: submission.website
  })

  revalidatePath('/')
  revalidatePath(getRoute('listing.list'))
  revalidatePath(getRoute('listing.detail', { slug }))

  return NextResponse.json({
    message: 'Verified! Your listing is live.',
    slug,
    verified: true
  })
}
