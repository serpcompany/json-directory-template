import { createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

type ServiceAccount = {
  client_email: string
  private_key: string
}

const sitemapTargets = [
  'serpdownloaders.com',
  'serp.software',
  'pornvideodownloaders.com',
  'serp.ai',
  'browserextensions.io',
  'serp.co'
].map(domain => ({
  domain,
  sitemapUrl: `https://${domain}/sitemap-index.xml`
}))

const webmastersScope = 'https://www.googleapis.com/auth/webmasters'

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function parseArgs(argv: string[]): { dryRun: boolean } {
  return {
    dryRun: argv.includes('--dry-run')
  }
}

function loadServiceAccount(env: NodeJS.ProcessEnv): ServiceAccount | undefined {
  if (env.GSC_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(env.GSC_SERVICE_ACCOUNT_JSON) as ServiceAccount
  }

  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')) as ServiceAccount
  }

  return undefined
}

function siteUrlFor(domain: string, env: NodeJS.ProcessEnv): string {
  const siteUrlMap = env.GSC_SITE_URL_MAP
    ? (JSON.parse(env.GSC_SITE_URL_MAP) as Record<string, string>)
    : {}

  return siteUrlMap[domain] ?? `https://${domain}/`
}

async function getAccessToken(env: NodeJS.ProcessEnv): Promise<string> {
  if (env.GSC_ACCESS_TOKEN) {
    return env.GSC_ACCESS_TOKEN
  }

  const serviceAccount = loadServiceAccount(env)
  if (!serviceAccount?.client_email || !serviceAccount.private_key) {
    throw new Error(
      'Missing GSC credentials. Set GSC_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or GSC_ACCESS_TOKEN.'
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const unsignedJwt = [
    base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    base64Url(
      JSON.stringify({
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
        iss: serviceAccount.client_email,
        scope: webmastersScope
      })
    )
  ].join('.')
  const signature = createSign('RSA-SHA256').update(unsignedJwt).sign(serviceAccount.private_key)
  const assertion = `${unsignedJwt}.${base64Url(signature)}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    body: new URLSearchParams({
      assertion,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
    }),
    method: 'POST'
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google access token: ${response.status} ${await response.text()}`
    )
  }

  const body = (await response.json()) as { access_token?: string }
  if (!body.access_token) {
    throw new Error('Google token response did not include access_token')
  }

  return body.access_token
}

async function submitSitemap(
  accessToken: string,
  siteUrl: string,
  sitemapUrl: string
): Promise<void> {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/sitemaps/${encodeURIComponent(sitemapUrl)}`
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    method: 'PUT'
  })

  if (!response.ok) {
    throw new Error(
      `Failed to submit ${sitemapUrl} for ${siteUrl}: ${response.status} ${await response.text()}`
    )
  }
}

export async function runSubmitGscSitemaps(
  argv = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const { dryRun } = parseArgs(argv)

  if (dryRun) {
    for (const target of sitemapTargets) {
      console.log(`${siteUrlFor(target.domain, env)} -> ${target.sitemapUrl}`)
    }
    return
  }

  const accessToken = await getAccessToken(env)

  for (const target of sitemapTargets) {
    const siteUrl = siteUrlFor(target.domain, env)
    await submitSitemap(accessToken, siteUrl, target.sitemapUrl)
    console.log(`Submitted ${target.sitemapUrl} for ${siteUrl}`)
  }
}

if (process.argv[1]?.endsWith('submit-gsc-sitemaps.ts')) {
  runSubmitGscSitemaps().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
