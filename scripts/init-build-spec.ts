import { existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadSiteDefinition } from './site-definition.ts'
import type { BuildSpec } from './build-spec.ts'

const workspaceRoot = resolve(process.cwd())

function parseSiteId(argv: string[], env: NodeJS.ProcessEnv = process.env): string {
  const siteFlagIndex = argv.findIndex(argument => argument === '--site')

  if (siteFlagIndex >= 0 && argv[siteFlagIndex + 1]) {
    return argv[siteFlagIndex + 1] as string
  }

  return env.SITE_ID || 'example-site'
}

function parseForce(argv: string[]): boolean {
  return argv.includes('--force')
}

function detectFirstFile(siteDir: string, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const path = resolve(siteDir, candidate)

    if (existsSync(path)) {
      return candidate
    }
  }

  return undefined
}

function detectWebsiteSource(siteDir: string): BuildSpec['content']['websiteSource'] | undefined {
  const productsPath = detectFirstFile(siteDir, ['products.json'])

  if (productsPath) {
    return {
      category: 'automation-workflow',
      featuredCount: 6,
      kind: 'trial-products-json',
      path: `sites/${siteDir.split('/').at(-1)}/${productsPath}`,
      publishedAt: new Date().toISOString().slice(0, 10)
    }
  }

  const websitesPath = detectFirstFile(siteDir, ['websites.json'])

  if (websitesPath) {
    return {
      kind: 'website-json',
      path: `sites/${siteDir.split('/').at(-1)}/${websitesPath}`
    }
  }

  return undefined
}

function buildSpecPath(siteId: string): string {
  return resolve(workspaceRoot, 'sites', siteId, 'build-spec.json')
}

function toOperatorDrBadge(
  badge: ReturnType<typeof loadSiteDefinition>['site']['drBadge'],
  siteDomain: string
): BuildSpec['branding']['drBadge'] {
  const expectedHref = 'https://dr.serp.co/'
  const expectedAlt = `Verified DR badge for ${siteDomain}`
  const expectedPrefix = `https://dr.serp.co/badge/${siteDomain}?style=`

  if (badge.href === expectedHref && badge.imageSrc.startsWith(expectedPrefix)) {
    const style = badge.imageSrc.slice(expectedPrefix.length)

    if (style === 'serp-dr-v3') {
      return {
        ...(badge.alt !== expectedAlt && { alt: badge.alt }),
        domain: siteDomain,
        provider: 'serp-dr',
        style: 'serp-dr-v3'
      }
    }
  }

  return {
    alt: badge.alt,
    height: badge.height,
    href: badge.href,
    imageSrc: badge.imageSrc,
    kind: 'raw',
    width: badge.width
  }
}

function buildSpecFromSiteDefinition(siteId: string, websiteSource: BuildSpec['content']['websiteSource']): BuildSpec {
  const definition = loadSiteDefinition(siteId)
  const siteDir = `sites/${siteId}`
  const faviconPath = detectFirstFile(resolve(workspaceRoot, siteDir), ['favicon.ico', 'favicon.png'])
  const logoPath = detectFirstFile(resolve(workspaceRoot, siteDir), [
    'logo.png',
    'logo.jpg',
    'logo.jpeg',
    'logo.webp',
    'logo.svg'
  ])
  const opengraphImagePath = detectFirstFile(resolve(workspaceRoot, siteDir), [
    'opengraph-image.png',
    'opengraph-image.jpg',
    'opengraph-image.jpeg',
    'opengraph-image.webp'
  ])

  return {
    branding: {
      drBadge: toOperatorDrBadge(definition.site.drBadge, definition.site.domain),
      ...(faviconPath && {
        favicon: {
          path: `${siteDir}/${faviconPath}`,
          source: 'local-path' as const
        }
      }),
      ...(logoPath && {
        logo: {
          path: `${siteDir}/${logoPath}`,
          source: 'local-path' as const
        }
      }),
      ...(opengraphImagePath && {
        opengraphImage: {
          path: `${siteDir}/${opengraphImagePath}`,
          source: 'local-path' as const
        }
      })
    },
    build: {
      mode: 'static-directory',
      siteId
    },
    content: {
      websiteSource
    },
    ...(definition.deploy && {
      deploy: {
        branch: definition.deploy.branch,
        preserve: definition.deploy.preserve,
        repoUrl: definition.deploy.repoUrl,
        strategy: definition.deploy.strategy
      }
    }),
    features: definition.site.features,
    site: {
      description: definition.site.description,
      domain: definition.site.domain,
      name: definition.site.name,
      publicUrl: definition.site.publicUrl || `https://${definition.site.domain}`,
      tagline: definition.site.tagline
    },
    social: {
      githubIssueOwner: definition.site.githubIssueOwner,
      githubIssueRepo: definition.site.githubIssueRepo,
      githubIssueTemplate: definition.site.githubIssueTemplate,
      githubIssuesUrl: definition.site.githubIssuesUrl,
      githubRepoUrl: definition.site.githubRepoUrl,
      githubUrl: definition.site.githubUrl,
      redditUrl: definition.site.redditUrl,
      twitterUrl: definition.site.twitterUrl
    },
    version: 1
  }
}

function buildPlaceholderSpec(siteId: string, websiteSource: BuildSpec['content']['websiteSource']): BuildSpec {
  return {
    branding: {
      drBadge: {
        domain: `${siteId}.com`,
        provider: 'serp-dr',
        style: 'serp-dr-v3'
      }
    },
    build: {
      mode: 'static-directory',
      siteId
    },
    content: {
      websiteSource
    },
    features: {
      showCreatorProjects: false,
      showDeveloperTools: false,
      showFeaturedGuides: false,
      showNewsletter: true
    },
    site: {
      description: 'TODO: add site description',
      domain: 'TODO.example.com',
      name: 'TODO Site Name',
      publicUrl: 'https://TODO.example.com',
      tagline: 'TODO: add site tagline'
    },
    social: {
      githubIssueOwner: 'TODO',
      githubIssueRepo: 'TODO',
      githubIssueTemplate: 'submit-website.yml',
      githubIssuesUrl: 'https://github.com/TODO/TODO/issues/new/choose',
      githubRepoUrl: 'https://github.com/TODO/TODO',
      githubUrl: 'https://github.com/TODO',
      redditUrl: 'https://www.reddit.com/r/webdev/',
      twitterUrl: 'https://x.com/TODO'
    },
    version: 1
  }
}

export function initBuildSpec(siteId: string, force = false): string {
  const siteDir = resolve(workspaceRoot, 'sites', siteId)
  const outputPath = buildSpecPath(siteId)
  const websiteSource = detectWebsiteSource(siteDir)

  if (!websiteSource) {
    throw new Error(
      `No staged content source found in sites/${siteId}. Add products.json or websites.json before generating a build spec.`
    )
  }

  if (existsSync(outputPath) && !force) {
    throw new Error(`Build spec already exists at sites/${siteId}/build-spec.json. Re-run with --force to overwrite it.`)
  }

  const spec = existsSync(resolve(workspaceRoot, 'records', 'site-definitions', `${siteId}.json`))
    ? buildSpecFromSiteDefinition(siteId, websiteSource)
    : buildPlaceholderSpec(siteId, websiteSource)

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`)

  return outputPath
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const siteId = parseSiteId(process.argv.slice(2))
  const outputPath = initBuildSpec(siteId, parseForce(process.argv.slice(2)))
  console.log(`Initialized build spec at ${outputPath}`)
}
