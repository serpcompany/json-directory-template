import * as cheerio from 'cheerio'
import { NextRequest, NextResponse } from 'next/server'
import { readListings } from '@/lib/listings-store'
import { siteConfig } from '@thedaviddias/web-core/site-config'

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

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const domain = siteConfig.domain
  const listings = readListings() as Array<{
    badgeMissingSince?: string
    name: string
    slug: string
    website: string
  }>
  const results: Array<{ hasBacklink: boolean; slug: string }> = []

  for (const listing of listings) {
    if (!listing.website) {
      continue
    }

    const hasBacklink = await checkBacklink(listing.website, domain)
    results.push({ hasBacklink, slug: listing.slug })
  }

  const missing = results.filter(result => !result.hasBacklink)

  return NextResponse.json({
    checked: results.length,
    missing: missing.length,
    missingListings: missing,
  })
}

async function checkBacklink(url: string, domain: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'DirectoryVerifier/1.0' },
    })
    const text = await response.text()
    const $ = cheerio.load(decodeHtmlEntities(text))
    return $(`a[href*="${domain}"]`).length > 0
  } catch {
    return false
  }
}
