import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { decode } from 'html-entities'
import { readListings } from '@/lib/listings-store'
import { siteConfig } from '@/lib/site-config'

// Protect with a secret so random callers can't trigger it
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const domain = siteConfig.domain
  const listings = readListings() as Array<{ slug: string; website: string; name: string; badgeMissingSince?: string }>

  const results: Array<{ slug: string; hasBacklink: boolean }> = []

  for (const listing of listings) {
    if (!listing.website) continue
    const hasBacklink = await checkBacklink(listing.website, domain)
    results.push({ slug: listing.slug, hasBacklink })

    // TODO: update listing badgeMissingSince field if missing
  }

  const missing = results.filter(r => !r.hasBacklink)
  return NextResponse.json({ checked: results.length, missing: missing.length, missingListings: missing })
}

async function checkBacklink(url: string, domain: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'DirectoryVerifier/1.0' },
    })
    const text = await res.text()
    const $ = cheerio.load(decode(text))
    return $(`a[href*="${domain}"]`).length > 0
  } catch {
    return false // treat unreachable as unknown, not missing
  }
}
