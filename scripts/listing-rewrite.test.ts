import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  absoluteMediaUrl,
  addRelatedLink,
  applyLinkCheck,
  applySourceOverrides,
  buildEntry,
  buildExistingInput,
  withoutReviews,
  pipelineNotes,
  existingListingCopyIssues,
  buildImages,
  buildInput,
  buildRelatedLinks,
  CATEGORY_MAP,
  checkFacts,
  checkRewrite,
  checkUrls,
  DEFAULT_EXCLUDE_FILE,
  diffSourceAgainstSite,
  extractFacts,
  extractNumbers,
  extractQuality,
  findSourceConflicts,
  githubRepoRoot,
  hasPassingOutput,
  isLegalFaq,
  isPricingFaq,
  main,
  mapCategories,
  parseArgs,
  permissionsIn,
  pricingLanguage,
  type RewriteInput,
  type RewriteOutput,
  readExcludeFile,
  type SiteProducts,
  sequenceRatio,
  similarity,
  slugCore,
  standardLegalAnswer,
  urlSlug,
  urlsToVerify,
  withoutPricing
} from './listing-rewrite.ts'
import type { SourceProduct, SourceProductFile } from './store-new-products.ts'

const LEGAL_ANSWER = 'DISCLAIMER: standard site legal answer.'

function sourceProduct(overrides: Partial<SourceProduct> = {}): SourceProduct {
  return {
    benefits: ['Keep permitted clips for offline viewing later on'],
    categories: ['Downloader', 'Adult', 'Video Downloader'],
    compatibility_sections: [
      {
        items: ['Desktop browsers with extension support', 'Windows, macOS, and Linux'],
        title: 'Works With',
        variant: 'supported'
      },
      { items: ['Safari', 'Mobile browsers'], title: 'Not Designed For', variant: 'unsupported' }
    ],
    description:
      'Example Tube Video Downloader saves a video that is already playing on an Example Tube page. Start playback, open the extension, and pick an available MP4 option.',
    faqs: [
      {
        answer: 'Files land in a dedicated Example Tube folder in your downloads.',
        question: 'Where are videos saved?'
      },
      {
        answer: 'The extension saves the MP4 file that the page already provides.',
        question: 'Which format do I get?'
      },
      {
        answer: 'No. It is built for desktop Chrome and Firefox; Safari is not supported.',
        question: 'Does it work on mobile?'
      },
      { answer: 'Only save videos you have rights to.', question: 'Is this legal?' }
    ],
    featured_image: '/media/optimized-products/example-tube-downloader-ready-abc.webp',
    features: ['Saves MP4 files into a dedicated Example Tube folder'],
    github_repo_url: 'https://github.com/serpapps/example-tube-downloader',
    how_it_works: [{ description: 'Open the page and press play.', title: 'Open a video' }],
    limitations: ['Safari and mobile browsers are not supported'],
    name: 'Example Tube Video Downloader',
    permission_justifications: [
      { justification: 'Saves the file through the browser.', permission: 'downloads' },
      { justification: 'Reads the tab you choose.', permission: 'activeTab' }
    ],
    platform: 'Example Tube',
    resource_links: [
      { href: 'https://serp.ly/example-tube-downloader', label: 'Product Page' },
      { href: 'https://example-tube.test/', label: 'Website' },
      { href: 'https://help.serp.co/en/articles/1', label: 'Help Center' },
      { href: 'https://apify.com/serpxxx/example-tube-downloader/', label: 'Apify' }
    ],
    screenshots: [
      { url: '/media/optimized-products/example-tube-downloader-ready-abc.webp' },
      { url: '/media/optimized-products/example-tube-downloader-formats-def.webp' }
    ],
    serply_link: 'https://serp.ly/example-tube-downloader',
    slug: 'example-tube-downloader',
    status: 'live',
    supported_operating_systems: ['windows', 'mac', 'linux', 'chrome', 'firefox'],
    supported_regions: ['Worldwide'],
    tagline: 'Save an Example Tube video from the page you are watching.',
    ...overrides
  }
}

function file(product: SourceProduct, name = `${product.slug}.json`): SourceProductFile {
  return { file: name, product }
}

const goodRewrite: RewriteOutput = {
  body: [
    '## What this extension does',
    '',
    'When a clip is already streaming on Example Tube, this add-on lets you keep a local copy. Hit play, click the toolbar icon, then choose whichever MP4 choice appears.',
    '',
    '## Reasons people install it',
    '',
    '- You get offline access to clips you are allowed to keep.',
    '- Everything is filed under its own Example Tube folder.',
    '',
    '## Getting a file',
    '',
    '- Start the clip: load the page, begin playback, and wait for the player.',
    '',
    '## Compatibility',
    '',
    'Supported on Chrome and Firefox desktop builds running Windows, macOS or Linux, in every region (Worldwide). Safari and mobile browsers are out of scope.',
    '',
    '## Permissions',
    '',
    '- `downloads` hands the finished file to your browser.',
    '- `activeTab` looks only at the tab you pick.'
  ].join('\n'),
  faq: [
    {
      answer: 'Look inside your downloads directory for the Example Tube folder.',
      question: 'Where do finished clips end up?'
    },
    {
      answer: 'You receive the same MP4 the page serves, unchanged.',
      question: 'What kind of file is produced?'
    },
    {
      answer: 'Phones are out; use Chrome or Firefox on a desktop. Safari is unsupported.',
      question: 'Can I use it on a phone?'
    }
  ],
  slug: 'example-tube-downloader',
  tagline: 'Keep a local copy of the Example Tube clip that is open in your tab.'
}

function exampleInput(): RewriteInput {
  const result = buildInput(file(sourceProduct()), {
    serpAiSlugs: new Set(),
    site: 'browserextensions.io'
  })
  if (!result.input) throw new Error('expected input')
  return result.input
}

describe('category mapping', () => {
  it('maps source categories per the #156 table and drops unmapped-to-null ones', () => {
    expect(mapCategories(['Downloader', 'Adult', 'Video Downloader', 'Fans Downloaders'])).toEqual({
      categories: ['adult', 'video-downloaders', 'fansite-downloaders'],
      unmapped: []
    })
    expect(mapCategories(['Course Platforms', 'Social Media', 'Utilities'])).toEqual({
      categories: ['course-platform-downloaders', 'social-media-downloaders'],
      unmapped: []
    })
    expect(mapCategories(['Privacy & Security', 'Live Cams'])).toEqual({
      categories: [],
      unmapped: ['Live Cams']
    })
  })

  it('only maps to categories that exist on browserextensions.io', () => {
    const categories = JSON.parse(
      readFileSync(resolve(process.cwd(), 'sites/browserextensions.io/categories.json'), 'utf8')
    ) as Array<{ slug: string }>
    const slugs = new Set(categories.map(category => category.slug))
    for (const mapped of Object.values(CATEGORY_MAP)) {
      if (mapped) expect(slugs.has(mapped), mapped).toBe(true)
    }
  })
})

describe('media and related links', () => {
  it('makes apps.serp.co media paths absolute and dedupes them', () => {
    expect(absoluteMediaUrl('/media/a.webp')).toBe('https://apps.serp.co/media/a.webp')
    expect(absoluteMediaUrl('https://cdn.test/a.webp')).toBe('https://cdn.test/a.webp')
    expect(absoluteMediaUrl('media/a.webp')).toBeUndefined()
    expect(buildImages(sourceProduct())).toEqual([
      'https://apps.serp.co/media/optimized-products/example-tube-downloader-ready-abc.webp',
      'https://apps.serp.co/media/optimized-products/example-tube-downloader-formats-def.webp'
    ])
  })

  it('builds related links without a serp.co review link or help center links', () => {
    expect(
      buildRelatedLinks(sourceProduct(), { serpAiSlugs: new Set(), site: 'browserextensions.io' })
    ).toEqual([
      { label: 'Install browser extension', url: 'https://serp.ly/example-tube-downloader' },
      { label: 'SERP Apps', url: 'https://apps.serp.co/example-tube-downloader' },
      {
        label: 'GitHub repository',
        url: 'https://github.com/serpapps/example-tube-downloader'
      },
      { label: 'Apify', url: 'https://apify.com/serpxxx/example-tube-downloader/' },
      {
        label: 'Browser Extensions',
        url: 'https://browserextensions.io/products/example-tube-downloader/'
      },
      {
        label: 'Latest Release',
        url: 'https://github.com/serpapps/example-tube-downloader/releases/latest'
      }
    ])
  })

  it('adds SERP AI only when the slug exists on serp.ai and skips non-product GitHub repos', () => {
    const links = buildRelatedLinks(
      sourceProduct({ github_repo_url: 'https://github.com/someone/player' }),
      { serpAiSlugs: new Set(['example-tube-downloader']), site: 'browserextensions.io' }
    )
    expect(links.map(link => link.label)).toEqual([
      'Install browser extension',
      'SERP Apps',
      'Apify',
      'SERP AI',
      'Browser Extensions'
    ])
    expect(links.find(link => link.label === 'SERP AI')?.url).toBe(
      'https://serp.ai/products/example-tube-downloader/reviews/'
    )
  })
})

describe('link verification', () => {
  it('classifies URLs and treats rate limits and network errors as unknown', async () => {
    const calls: string[] = []
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push(`${init?.method} ${String(url)}`)
      if (String(url).endsWith('/gone')) return new Response(null, { status: 404 })
      if (String(url).endsWith('/limited')) return new Response(null, { status: 429 })
      if (String(url).endsWith('/flaky')) throw new Error('network down')
      if (String(url).endsWith('/head-not-allowed') && init?.method === 'HEAD') {
        return new Response(null, { status: 405 })
      }
      return new Response(null, { status: 200 })
    }) as unknown as typeof fetch
    const result = await checkUrls(
      [
        'https://github.com/serpapps/ok',
        'https://github.com/serpapps/gone',
        'https://github.com/serpapps/limited',
        'https://github.com/serpapps/flaky',
        'https://github.com/serpapps/head-not-allowed'
      ],
      { delayMs: 0, fetcher, retries: 2 }
    )
    expect(Object.fromEntries(result)).toEqual({
      'https://github.com/serpapps/flaky': 'unknown',
      'https://github.com/serpapps/gone': 'dead',
      'https://github.com/serpapps/head-not-allowed': 'ok',
      'https://github.com/serpapps/limited': 'unknown',
      'https://github.com/serpapps/ok': 'ok'
    })
    expect(calls.filter(call => call.endsWith('/limited'))).toHaveLength(3)
  })

  it('drops GitHub links and images that are not ok and records what it dropped', () => {
    const input = exampleInput()
    expect(urlsToVerify(input)).toEqual([
      'https://apps.serp.co/media/optimized-products/example-tube-downloader-ready-abc.webp',
      'https://apps.serp.co/media/optimized-products/example-tube-downloader-formats-def.webp',
      'https://serp.ly/example-tube-downloader',
      'https://apps.serp.co/example-tube-downloader',
      'https://github.com/serpapps/example-tube-downloader',
      'https://github.com/serpapps/example-tube-downloader/releases/latest'
    ])
    const statuses = new Map(urlsToVerify(input).map(url => [url, 'ok' as const]))
    statuses.set('https://github.com/serpapps/example-tube-downloader', 'dead')
    statuses.set(
      'https://apps.serp.co/media/optimized-products/example-tube-downloader-formats-def.webp',
      'unknown'
    )
    const { input: checked, skipReason } = applyLinkCheck(input, statuses, 'now')
    expect(skipReason).toBeUndefined()
    expect(checked.entry.relatedLinks.map(link => link.label)).toEqual([
      'Install browser extension',
      'SERP Apps',
      'Apify',
      'Browser Extensions'
    ])
    expect(checked.entry.images).toEqual([
      'https://apps.serp.co/media/optimized-products/example-tube-downloader-ready-abc.webp'
    ])
    expect(checked.linkCheck?.droppedLinks).toHaveLength(2)
    expect(checked.linkCheck?.droppedImages).toHaveLength(1)
  })

  it('skips a slug whose install link is not reachable', () => {
    const input = exampleInput()
    const statuses = new Map(urlsToVerify(input).map(url => [url, 'ok' as const]))
    statuses.set('https://serp.ly/example-tube-downloader', 'unknown')
    expect(applyLinkCheck(input, statuses, 'now').skipReason).toBe(
      'unreachable Install browser extension (unknown)'
    )
  })
})

describe('diffSourceAgainstSite', () => {
  const site: SiteProducts = {
    'beeg-video-downloader': {
      product: { productPage: 'https://serp.ly/beeg-video-downloader', title: 'Beeg' }
    },
    'cam4-downloader': {
      product: { productPage: 'https://serp.ly/cam4-downloader', title: 'Cam4' }
    },
    'present-downloader': {
      product: { productPage: 'https://serp.ly/present-downloader', title: 'Present' }
    },
    'renamed-video-downloader': {
      product: { productPage: 'https://serp.ly/renamed-video-downloader', title: 'Renamed' },
      relatedLinks: [
        {
          label: 'Latest Release',
          url: 'https://github.com/serpapps/old-repo-downloader/releases/latest'
        }
      ]
    }
  }

  it('dedupes by slug, serply_link, GitHub URL and product name', () => {
    const result = diffSourceAgainstSite(
      [
        file(sourceProduct({ slug: 'present-downloader' })),
        file(
          sourceProduct({
            github_repo_url: null,
            serply_link: 'https://serp.ly/cam4-downloader',
            slug: 'cam4-video-downloader'
          })
        ),
        file(
          sourceProduct({
            github_repo_url: null,
            serply_link: 'https://serp.ly/beeg-downloader',
            slug: 'beeg-downloader'
          })
        ),
        file(
          sourceProduct({
            github_repo_url: 'https://github.com/serpapps/new-downloader',
            serply_link: 'https://serp.ly/new',
            slug: 'new-downloader'
          })
        ),
        file(
          sourceProduct({
            github_repo_url: 'https://github.com/serpapps/old-repo-downloader',
            serply_link: 'https://serp.ly/brand-new-name',
            slug: 'brand-new-name-downloader'
          })
        ),
        file(sourceProduct({ slug: 'draft-downloader', status: 'coming_soon' }))
      ],
      site
    )

    expect(result.liveCount).toBe(5)
    expect(result.present).toEqual(['present-downloader'])
    expect(result.duplicateUnderOtherSlug).toEqual([
      {
        matchedBy: 'github_repo_url',
        siteSlug: 'renamed-video-downloader',
        slug: 'brand-new-name-downloader'
      },
      { matchedBy: 'serply_link', siteSlug: 'cam4-downloader', slug: 'cam4-video-downloader' }
    ])
    expect(result.ambiguous).toEqual([])
    expect(result.resolved).toEqual([
      {
        canonical: 'beeg-video-downloader',
        installLink: {
          label: 'Example Tube Video Downloader',
          url: 'https://serp.ly/beeg-downloader'
        },
        rule: 'existing listing beeg-video-downloader is canonical',
        slug: 'beeg-downloader'
      }
    ])
    expect(result.missing.map(item => item.product.slug)).toEqual(['new-downloader'])
  })

  it('offers no extra install link when the existing listing already has it', () => {
    const result = diffSourceAgainstSite(
      [
        file(
          sourceProduct({
            github_repo_url: null,
            serply_link: 'https://serp.ly/beeg-alt',
            slug: 'beeg-downloader'
          })
        )
      ],
      {
        'beeg-video-downloader': {
          product: { productPage: 'https://serp.ly/beeg-video-downloader', title: 'Beeg' },
          relatedLinks: [{ label: 'Beeg Alt', url: 'https://serp.ly/beeg-alt/' }]
        }
      }
    )
    expect(result.resolved).toEqual([
      expect.objectContaining({ canonical: 'beeg-video-downloader', slug: 'beeg-downloader' })
    ])
    expect(result.resolved[0]?.installLink).toBeUndefined()
  })

  it('resolves same-slug source files by commit history and shared links by slug', () => {
    const product = sourceProduct({
      github_repo_url: null,
      serply_link: 'https://serp.ly/a',
      slug: 'dupe-downloader'
    })
    const same = sourceProduct({
      github_repo_url: null,
      serply_link: 'https://serp.ly/s',
      slug: 'same-downloader'
    })
    const shared = (slug: string) =>
      file(
        sourceProduct({ github_repo_url: null, serply_link: 'https://serp.ly/x2-downloader', slug })
      )
    const generic = (slug: string) =>
      file(sourceProduct({ github_repo_url: null, serply_link: 'https://serp.ly/tools', slug }))
    const files = [
      file(product, 'dupe-downloader.json'),
      file({ ...product, tagline: 'different' }, 'dupe-downloader.jsonc'),
      file(same, 'same-downloader.json'),
      file({ ...same }, 'same-downloader.jsonc'),
      shared('x1-downloader'),
      shared('x2-downloader'),
      generic('g1-downloader'),
      generic('g2-downloader')
    ]
    // Both files share their newest commit; the .json was also changed more recently before.
    const history: Record<string, number[]> = {
      'dupe-downloader.json': [300, 200, 100],
      'dupe-downloader.jsonc': [300, 100]
    }
    const result = diffSourceAgainstSite(files, {}, { fileHistory: name => history[name] })

    expect(result.sourceDuplicates).toEqual([
      {
        chosen: 'dupe-downloader.json',
        files: ['dupe-downloader.json', 'dupe-downloader.jsonc'],
        identical: false,
        slug: 'dupe-downloader'
      },
      {
        chosen: 'same-downloader.json',
        files: ['same-downloader.json', 'same-downloader.jsonc'],
        identical: true,
        slug: 'same-downloader'
      }
    ])
    expect(result.resolved).toEqual([
      expect.objectContaining({ canonical: 'dupe-downloader.json', slug: 'dupe-downloader' }),
      expect.objectContaining({ canonical: 'x2-downloader', slug: 'x1-downloader' })
    ])
    expect(result.ambiguous.map(item => item.slug).sort()).toEqual([
      'g1-downloader',
      'g2-downloader'
    ])
    expect(result.missing.map(item => item.file)).toEqual([
      'dupe-downloader.json',
      'same-downloader.json',
      'x2-downloader.json'
    ])
  })

  it('leaves differing same-slug files ambiguous without commit history', () => {
    const product = sourceProduct({ slug: 'dupe-downloader' })
    const files = [
      file(product, 'dupe-downloader.json'),
      file({ ...product, tagline: 'different' }, 'dupe-downloader.jsonc')
    ]
    expect(diffSourceAgainstSite(files, {}).ambiguous.map(item => item.slug)).toEqual([
      'dupe-downloader'
    ])
    const tie = diffSourceAgainstSite(files, {}, { fileHistory: () => [5, 4] })
    expect(tie.ambiguous.map(item => item.slug)).toEqual(['dupe-downloader'])
  })

  it('applies owner source overrides before the diff', () => {
    const generic = (slug: string) =>
      file(
        sourceProduct({
          github_repo_url: null,
          serply_link: 'https://serp.ly/serp-video-tools',
          slug
        })
      )
    const files = [generic('hentaishare-downloader'), generic('pornvideocasting-downloader')]
    expect(diffSourceAgainstSite(files, {}).ambiguous).toHaveLength(2)

    const corrected = applySourceOverrides(files, {
      'hentaishare-downloader': {
        reason: 'owner: product-specific install link',
        set: { serply_link: 'https://serp.ly/hentaishare-downloader' }
      },
      'pornvideocasting-downloader': { reason: 'owner: unknown product, skipped', skip: true }
    })
    expect(corrected.skipped).toEqual([
      { reason: 'owner: unknown product, skipped', slug: 'pornvideocasting-downloader' }
    ])
    const result = diffSourceAgainstSite(corrected.files, {})
    expect(result.ambiguous).toEqual([])
    expect(result.missing.map(item => item.product.serply_link)).toEqual([
      'https://serp.ly/hentaishare-downloader'
    ])
  })

  it('reads the slug of a serp.ly or GitHub link', () => {
    expect(urlSlug('https://serp.ly/serp-video-tools')).toBe('serp-video-tools')
    expect(urlSlug('https://github.com/serpapps/x-downloader/')).toBe('x-downloader')
    expect(urlSlug('https://example.com/x')).toBeUndefined()
  })

  it("adds an extra install link after the listing's own one, once", () => {
    const entry = {
      relatedLinks: [
        { label: 'Install browser extension', url: 'https://serp.ly/beeg-video-downloader' },
        { label: 'SERP Apps', url: 'https://apps.serp.co/beeg-video-downloader' }
      ]
    }
    const link = { label: 'Beeg Video Downloader', url: 'https://serp.ly/beeg-downloader' }
    const once = addRelatedLink(entry, link)
    expect(once.relatedLinks?.map(item => item.label)).toEqual([
      'Install browser extension',
      'Beeg Video Downloader',
      'SERP Apps'
    ])
    expect(addRelatedLink(once, link)).toBe(once)
    expect(
      addRelatedLink(once, { label: 'Beeg Video Downloader', url: 'https://serp.ly/other' })
        .relatedLinks?.[1]?.label
    ).toBe('Beeg Video Downloader (2)')
  })

  it('reads the repo root from any serpapps GitHub URL', () => {
    expect(githubRepoRoot('https://github.com/serpapps/x-downloader/releases/latest')).toBe(
      'https://github.com/serpapps/x-downloader'
    )
    expect(githubRepoRoot('https://github.com/someone/x')).toBeUndefined()
  })

  it('reduces slugs to a comparable product name', () => {
    expect(slugCore('beeg-video-downloader')).toBe(slugCore('beeg-downloader'))
    expect(slugCore('alpha-porno-video-downloader')).toBe(slugCore('alphaporno-downloader'))
    expect(slugCore('rule34video-downloader')).not.toBe(slugCore('rule34-downloader'))
  })
})

describe('buildInput', () => {
  it('builds the entry, source copy and facts for a mappable product', () => {
    const input = exampleInput()
    expect(input.entry).toMatchObject({
      categories: ['adult', 'video-downloaders'],
      featured: true,
      productPage: 'https://serp.ly/example-tube-downloader',
      title: 'Example Tube Video Downloader'
    })
    expect(input.source.faq.map(entry => entry.question)).not.toContain('Is this legal?')
    expect(input.source.body).toContain('## Platform Support')
    expect(input.source.body).not.toContain('## Reviews')
    expect(input.facts).toMatchObject({
      browsers: ['Chrome', 'Firefox', 'Safari'],
      folder: true,
      formats: ['MP4'],
      operatingSystems: ['Windows', 'macOS', 'Linux'],
      permissions: ['activeTab', 'downloads'],
      platform: 'Example Tube',
      regions: ['Worldwide']
    })
  })

  it('reports browser lists that contradict each other in the source', () => {
    const conflicts = findSourceConflicts(
      sourceProduct({
        compatibility_sections: [
          { items: ['Chrome', 'Firefox'], title: 'Browsers', variant: 'supported' }
        ],
        faqs: [{ answer: 'It is supported on Chrome only.', question: 'Which browsers?' }],
        supported_operating_systems: ['windows', 'chrome', 'firefox', 'edge']
      })
    )
    expect(conflicts).toEqual([
      'supported_operating_systems lists Chrome, Firefox, Edge; the "Browsers" section lists Chrome, Firefox'
    ])
  })

  it('only treats "Is this legal?"-style questions as the legal FAQ', () => {
    expect(isLegalFaq({ question: 'Is this legal?' })).toBe(true)
    expect(isLegalFaq({ question: 'Is downloading from Example legal?' })).toBe(true)
    expect(isLegalFaq({ question: 'Does it remove copyright watermarks?' })).toBe(false)
  })

  it('skips products without a mappable category', () => {
    const result = buildInput(file(sourceProduct({ categories: ['Privacy & Security'] })), {
      serpAiSlugs: new Set(),
      site: 'browserextensions.io'
    })
    expect(result.input).toBeUndefined()
    expect(result.skipReason).toBe('no mappable category')
  })

  it('puts adult-only products in video-downloaders and features every listing', () => {
    const result = buildInput(file(sourceProduct({ categories: ['Downloader', 'Adult'] })), {
      serpAiSlugs: new Set(),
      site: 'browserextensions.io'
    })
    expect(result.input?.entry.categories).toEqual(['adult', 'video-downloaders'])
    expect(result.input?.entry.featured).toBe(true)
  })

  it('builds facts without pricing or trial terms', () => {
    const result = buildInput(
      file(
        sourceProduct({
          features: [
            'Saves MP4 files into a dedicated Example Tube folder',
            'Try it free with 3 downloads'
          ],
          permission_justifications: [
            {
              justification: 'Stores activation, trial, and preference state.',
              permission: 'storage'
            }
          ]
        })
      ),
      { serpAiSlugs: new Set(), site: 'browserextensions.io' }
    )
    expect(result.input?.facts.numbers).toEqual([])
    expect(result.input?.facts.permissions).toEqual(['storage'])
  })
})

describe('similarity', () => {
  it('scores identical text 1 and unrelated text low', () => {
    expect(similarity('one two three four five six', 'one two three four five six')).toEqual({
      jaccard: 1,
      ratio: 1
    })
    const unrelated = similarity(
      'Save the clip you are watching for later offline playback.',
      'Course backups keep lesson folders in their original order.'
    )
    expect(unrelated.ratio).toBeLessThan(0.3)
    expect(unrelated.jaccard).toBe(0)
  })

  it('treats listings that only swap the platform name as duplicates', () => {
    const a = 'Alpha Tube Downloader saves Alpha Tube clips into a dedicated Alpha Tube folder.'
    const b = 'Beta Site Downloader saves Beta Site clips into a dedicated Beta Site folder.'
    expect(similarity(a, b).ratio).toBeLessThan(1)
    const normalizedA = similarity(a, b, [
      'Alpha Tube Downloader',
      'Alpha Tube',
      'Beta Site Downloader',
      'Beta Site'
    ])
    expect(normalizedA).toEqual({ jaccard: 1, ratio: 1 })
  })

  it('computes the word LCS ratio', () => {
    expect(sequenceRatio(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'd'])).toBe(0.75)
    expect(sequenceRatio([], [])).toBe(0)
  })
})

describe('fact preservation', () => {
  const facts = extractFacts(
    withoutPricing(
      [
        'Works on Chrome and Firefox (Windows, macOS). Saves MP4 in 1080p or 720p into a folder.',
        'Try it free: 3 free downloads, then a one-time payment. Up to 2 videos per tab. Worldwide.',
        '- downloads: saves the file',
        '- activeTab: reads the open tab'
      ].join('\n')
    ),
    'Example Tube'
  )

  it('passes when every fact is kept and no pricing is mentioned', () => {
    expect(
      checkFacts(
        facts,
        [
          'Example Tube clips save as MP4 (1080p or 720p) inside a folder; Chrome or Firefox on Windows or macOS.',
          'At most 2 videos per tab. Worldwide.',
          '- `downloads` writes the file',
          '- `activeTab` looks at the open tab'
        ].join('\n')
      )
    ).toEqual([])
  })

  it('finds pricing and trial language', () => {
    expect(pricingLanguage('Three free downloads, then a monthly subscription.')).toEqual([
      'subscription plan ("monthly subscription")',
      'free downloads ("Three free downloads")',
      'usage allowance ("Three free downloads")'
    ])
    expect(pricingLanguage('Includes 3 complimentary downloads.')).toEqual([
      'free downloads ("complimentary downloads")',
      'usage allowance ("3 complimentary downloads")'
    ])
    expect(pricingLanguage('Try 3 free captures.')).toEqual([
      'usage allowance ("3 free captures")',
      'test allowance ("Try 3 free captures")'
    ])
    expect(pricingLanguage('Record 3 free recordings first.')).toEqual([
      'usage allowance ("3 free recordings")'
    ])
    expect(pricingLanguage('Stores trial state. No credit card.')).toEqual([
      'trial ("trial")',
      'credit card ("credit card")'
    ])
    expect(
      pricingLanguage('Works with your Fansly subscriptions and paid access you already have.')
    ).toEqual([])
    expect(withoutPricing('Get 3 free downloads today.')).not.toMatch(/3/)
    expect(
      withoutPricing('Saves MP4. You get three free trial downloads, no credit card required.')
    ).toBe('Saves MP4.')
    expect(withoutPricing('- storage: Stores activation, trial, and preference state.')).toBe(
      '- storage: '
    )
    expect(pricingLanguage('Test the tool on three of your own permitted pages first.')).toEqual([
      'test allowance ("Test the tool on three of your own permitted pages")'
    ])
    expect(pricingLanguage('Check compatibility before committing to the tool.')).toEqual([
      'purchase decision ("before committing")'
    ])
    expect(
      isPricingFaq({ answer: 'After the free trial you can buy it.', question: 'Save more?' })
    ).toBe(true)
    expect(pricingLanguage('Save three permitted pages after email verification.')).toEqual([
      'usage allowance ("three permitted pages")'
    ])
  })

  it('ignores ordered-list markers when comparing numbers', () => {
    expect(extractNumbers('1. Open the page\n2. Press play\nSupports Chrome 116+.')).toEqual([
      '116'
    ])
  })

  it('reads quality options and only counts permissions written as permissions', () => {
    expect(extractQuality('Pick 1080p, 4K or 60 fps.')).toEqual(['1080p', '4K', '60fps'])
    expect(permissionsIn('Get 3 free downloads and open tabs.')).toEqual([])
    expect(permissionsIn('- `downloads`: saves\n- **tabs** — tracks the tab')).toEqual([
      'downloads',
      'tabs'
    ])
    expect(
      permissionsIn(
        '- activeTab and tabs: tracks\n- declarativeNetRequestWithHostAccess and host permissions: rules'
      )
    ).toEqual(['activeTab', 'declarativeNetRequestWithHostAccess', 'host_permissions', 'tabs'])
  })

  it('reports dropped and invented facts, and pricing language', () => {
    const issues = checkFacts(
      facts,
      'Example Tube saves WebM files in 480p on Chrome, Edge and Android with 5 videos and a lifetime license. Uses `downloads`.'
    )
    expect(issues).toEqual(
      expect.arrayContaining([
        'pricing/trial language not allowed: lifetime ("lifetime license")',
        'browsers missing: Firefox',
        'browsers not in source: Edge',
        'operating systems missing: Windows, macOS',
        'operating systems not in source: Android',
        'formats missing: MP4',
        'formats not in source: WebM',
        'permissions missing: activeTab',
        'quality options missing: 1080p, 720p',
        'quality options not in source: 480p',
        'numbers not in source: 5',
        'numbers missing: 2',
        'regions missing: Worldwide',
        'save folder missing'
      ])
    )
  })
})

describe('checkRewrite', () => {
  const context = { otherListings: [], otherSites: {}, threshold: 0.5 }

  it('fails the verbatim source copy', () => {
    const input = exampleInput()
    const result = checkRewrite(
      input,
      {
        body: input.source.body,
        faq: input.source.faq,
        slug: input.slug,
        tagline: input.source.tagline
      },
      context
    )
    expect(result.pass).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining(['body too similar to source', 'tagline too similar to source'])
    )
  })

  it('passes a rewrite that keeps facts and changes the wording', () => {
    const result = checkRewrite(exampleInput(), goodRewrite, context)
    expect(result.issues).toEqual([])
    expect(result.pass).toBe(true)
    expect(result.scores.bodyVsSource.ratio).toBeLessThanOrEqual(0.5)
  })

  it('fails a rewrite that is a platform-swapped copy of another listing', () => {
    const otherBody = goodRewrite.body.replaceAll('Example Tube', 'Other Site')
    const result = checkRewrite(exampleInput(), goodRewrite, {
      ...context,
      otherListings: [
        {
          body: otherBody,
          names: ['Other Site Video Downloader', 'Other Site'],
          slug: 'other-site-downloader'
        }
      ]
    })
    expect(result.pass).toBe(false)
    expect(result.issues).toContain('body too similar to other-site-downloader')
  })

  it('fails reused FAQ questions, shared sentences and identical headings across listings', () => {
    const other = {
      body: goodRewrite.body.replace(
        'When a clip is already streaming',
        'Unrelated opening text that is different. When a clip is already streaming'
      ),
      faq: [
        { answer: 'Something else entirely here.', question: 'Where do finished clips end up?' }
      ],
      names: ['Other Site'],
      slug: 'other-site-downloader',
      tagline: 'Different tagline.'
    }
    const result = checkRewrite(exampleInput(), goodRewrite, { ...context, otherListings: [other] })
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'faq question too close to other-site-downloader: "where do finished clips end up" ~ "where do finished clips end up"',
        'same section headings as other-site-downloader'
      ])
    )
    expect(result.issues.some(issue => issue.startsWith('sentences shared with other-site'))).toBe(
      true
    )
  })

  it('fails near-identical FAQ questions and mostly shared headings or step labels', () => {
    const other = {
      body: [
        '## What this extension does',
        '',
        'Completely different words live here.',
        '',
        '## Reasons people install it',
        '',
        '- **Load the page.** Something.',
        '',
        '## Getting a file',
        '',
        'More.'
      ].join('\n'),
      faq: [{ answer: 'x', question: 'Where do my finished clips end up?' }],
      names: ['Other Site'],
      slug: 'other-site-downloader'
    }
    const result = checkRewrite(exampleInput(), goodRewrite, { ...context, otherListings: [other] })
    expect(result.issues.some(issue => issue.startsWith('faq question too close to'))).toBe(true)
    expect(result.issues.some(issue => issue.startsWith('reuses headings/step labels of'))).toBe(
      true
    )
  })

  it('compares against the same product on other sites', () => {
    const result = checkRewrite(exampleInput(), goodRewrite, {
      ...context,
      otherSites: { 'serp.ai': goodRewrite.body }
    })
    expect(result.scores.bodyVsOtherSites?.['serp.ai']).toEqual({ jaccard: 1, ratio: 1 })
    expect(result.issues).toContain('body too similar to the serp.ai listing')
  })

  it('fails when FAQ entries are dropped', () => {
    const result = checkRewrite(
      exampleInput(),
      { ...goodRewrite, faq: [...goodRewrite.faq.slice(0, 2), goodRewrite.faq[2], ...[]] },
      context
    )
    expect(result.pass).toBe(true)
    const input = exampleInput()
    input.source.faq.push({ answer: 'More.', question: 'An extra source question?' })
    expect(checkRewrite(input, goodRewrite, context).issues).toContain(
      'faq dropped entries (3 vs 4 non-pricing in source); rewrite every one'
    )
  })

  it('fails outputs with the wrong shape', () => {
    const result = checkRewrite(
      exampleInput(),
      { ...goodRewrite, body: '# Title\n\nhttps://apps.serp.co/x', faq: [] },
      context
    )
    expect(result.pass).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'body must not contain an h1',
        'body must not contain URLs',
        'faq needs at least 3 entries (legal FAQ is added by apply)'
      ])
    )
  })
})

describe('apply helpers', () => {
  it('appends the standard legal FAQ and keeps the products.json shape', () => {
    const entry = buildEntry(exampleInput(), goodRewrite, LEGAL_ANSWER)
    expect(entry).toMatchObject({
      featured: true,
      media: {
        images: [
          'https://apps.serp.co/media/optimized-products/example-tube-downloader-ready-abc.webp',
          'https://apps.serp.co/media/optimized-products/example-tube-downloader-formats-def.webp'
        ]
      },
      product: {
        categories: ['adult', 'video-downloaders'],
        productPage: 'https://serp.ly/example-tube-downloader',
        slug: 'example-tube-downloader',
        tagline: goodRewrite.tagline,
        title: 'Example Tube Video Downloader'
      }
    })
    expect(entry.content?.faq?.at(-1)).toEqual({ answer: LEGAL_ANSWER, question: 'Is this legal?' })
    expect(JSON.stringify(entry)).not.toContain('serp.co/products/')
  })

  it("keeps an existing listing's own legal FAQ and adds none when it had none", () => {
    const withLegal: SiteProducts[string] = {
      content: {
        body: 'old',
        faq: [
          { answer: 'old', question: 'Old question?' },
          { answer: 'custom legal', question: 'Is this legal?' }
        ]
      },
      product: { productPage: 'https://serp.ly/x', title: 'X Downloader' }
    }
    const input = buildExistingInput('x-downloader', withLegal, 'browserextensions.io')
    if (!input) throw new Error('expected input')
    expect(buildEntry(input, goodRewrite, LEGAL_ANSWER, withLegal).content?.faq?.at(-1)).toEqual({
      answer: 'custom legal',
      question: 'Is this legal?'
    })
    const withoutLegal = { ...withLegal, content: { body: 'old', faq: [] } }
    expect(
      buildEntry(input, goodRewrite, LEGAL_ANSWER, withoutLegal).content?.faq?.map(f => f.question)
    ).toEqual(goodRewrite.faq.map(f => f.question))
  })

  it('leaves star-rated review testimonials out of existing-listing facts', () => {
    const body = [
      '## Overview\n\nSaves X videos as MP4 in 720p.',
      '## Reviews\n\n- Great (4.9/5): Saved 50+ videos. - A. B.\n- Solid (5/5): Works. - C. D.',
      '## Platform Support\n\n- Chrome'
    ].join('\n\n')
    expect(withoutReviews(body)).toBe(
      '## Overview\n\nSaves X videos as MP4 in 720p.\n\n## Platform Support\n\n- Chrome'
    )
    const input = buildExistingInput(
      'x-downloader',
      {
        content: { body, faq: [] },
        product: { productPage: 'https://serp.ly/x', title: 'X Downloader' }
      },
      'serpdownloaders.com'
    )
    expect(input?.facts.quality).toEqual(expect.arrayContaining(['720p']))
    expect(input?.facts.numbers).not.toEqual(expect.arrayContaining(['4.9']))
    expect(input?.facts.numbers).not.toEqual(expect.arrayContaining(['50']))
  })

  it('flags pipeline notes and recreated template structure in existing-listing rewrites', () => {
    expect(pipelineNotes('Detects MP4 and HLS candidates on the page.')).toEqual([])
    expect(pipelineNotes('Links pass through a handoff route; useful for team handoffs.')).toEqual(
      []
    )
    expect(pipelineNotes('It is still a candidate that relies on generated stubs.')).toEqual([
      'candidate status ("still a candidate")',
      'stubs ("generated stubs")'
    ])
    const output = {
      body: '## Troubleshooting\n\nX Downloader is a browser extension.\n\n## B\n\nb\n\n## C\n\nc',
      faq: [],
      slug: 'x-downloader',
      tagline: 'Too short.'
    }
    expect(existingListingCopyIssues(output, ['X Downloader'])).toEqual([
      'old template section headings: Troubleshooting',
      'body opens with a "<Name> is a ..." definition',
      'tagline must be 70-160 characters (has 10)'
    ])
  })

  it('rejects unusable --threshold and --limit values', () => {
    expect(() => parseArgs(['check', '--threshold', 'abc'], process.cwd())).toThrow()
    expect(() => parseArgs(['check', '--threshold', '0.9'], process.cwd())).toThrow()
    expect(() => parseArgs(['prepare', '--limit', 'x'], process.cwd())).toThrow()
    expect(parseArgs(['prepare'], process.cwd()).verifyLinks).toBe(true)
    expect(parseArgs(['prepare', '--no-verify-links'], process.cwd()).verifyLinks).toBe(false)
  })

  it('picks the most common legal answer on the site', () => {
    expect(
      standardLegalAnswer({
        a: { content: { faq: [{ answer: 'x', question: 'Is this legal?' }] } },
        b: { content: { faq: [{ answer: 'y', question: 'Is this legal?' }] } },
        c: { content: { faq: [{ answer: 'y', question: 'Is this legal?' }] } }
      })
    ).toBe('y')
  })

  it('reads the exclude list, ignoring comments and blank lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'listing-rewrite-exclude-'))
    const path = join(dir, 'exclude.txt')
    writeFileSync(path, '# header\n\na-downloader\nb-downloader # why\n')
    expect(readExcludeFile(path)).toEqual(['a-downloader', 'b-downloader'])
    rmSync(dir, { force: true, recursive: true })
    const shipped = readExcludeFile(resolve(process.cwd(), DEFAULT_EXCLUDE_FILE))
    expect(shipped.every(slug => /^[a-z0-9-]+-downloader$/.test(slug))).toBe(true)
  })
})

describe('prepare -> check -> apply', () => {
  let root: string | undefined

  afterEach(() => {
    if (root) rmSync(root, { force: true, recursive: true })
    root = undefined
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    process.exitCode = 0
  })

  it('runs end to end in a temp repo without falling back to source copy', async () => {
    root = mkdtempSync(join(tmpdir(), 'listing-rewrite-'))
    const productsDir = join(root, 'store-new/apps/serp-apps/data/products')
    mkdirSync(productsDir, { recursive: true })
    mkdirSync(join(root, 'sites/browserextensions.io'), { recursive: true })
    writeFileSync(
      join(productsDir, 'example-tube-downloader.jsonc'),
      `{\n  // PRODUCT INFO\n${JSON.stringify(sourceProduct()).slice(1)}`
    )
    writeFileSync(
      join(productsDir, 'excluded-downloader.json'),
      JSON.stringify(
        sourceProduct({
          github_repo_url: null,
          serply_link: 'https://serp.ly/excluded',
          slug: 'excluded-downloader'
        })
      )
    )
    writeFileSync(
      join(productsDir, 'missing-output-downloader.json'),
      JSON.stringify(
        sourceProduct({
          github_repo_url: null,
          serply_link: 'https://serp.ly/mo',
          slug: 'missing-output-downloader'
        })
      )
    )
    const existing: SiteProducts = {
      'existing-downloader': {
        content: {
          body: '## Overview\n\nExisting copy.',
          faq: [{ answer: LEGAL_ANSWER, question: 'Is this legal?' }]
        },
        product: {
          productPage: 'https://serp.ly/existing-downloader',
          slug: 'existing-downloader',
          title: 'Existing'
        }
      }
    }
    writeFileSync(join(root, 'sites/browserextensions.io/products.json'), JSON.stringify(existing))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    // GitHub repo for example-tube is dead; everything else is reachable.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (url: string) =>
          new Response(null, {
            status: String(url).startsWith('https://github.com/serpapps/example-tube') ? 404 : 200
          })
      )
    )

    const work = 'tmp/listing-rewrites'
    await main(
      ['prepare', '--source-dir', join(root, 'store-new'), '--exclude', 'excluded-downloader'],
      root
    )
    expect(
      readFileSync(join(root, work, 'pending.txt'), 'utf8')
        .trim()
        .split('\n')
    ).toEqual(['example-tube-downloader', 'missing-output-downloader'])
    const diff = JSON.parse(readFileSync(join(root, work, 'diff.json'), 'utf8'))
    expect(diff.skipped).toEqual([
      { reason: 'excluded (needs owner decision)', slug: 'excluded-downloader' }
    ])
    expect(diff.githubRepos).toMatchObject({
      dead: ['https://github.com/serpapps/example-tube-downloader']
    })
    const preparedInput = JSON.parse(
      readFileSync(join(root, work, 'input/example-tube-downloader.json'), 'utf8')
    ) as RewriteInput
    expect(preparedInput.entry.relatedLinks.map(link => link.label)).not.toContain(
      'GitHub repository'
    )

    mkdirSync(join(root, work, 'output'), { recursive: true })
    writeFileSync(
      join(root, work, 'output/example-tube-downloader.json'),
      JSON.stringify(goodRewrite)
    )
    await main(['apply', '--slugs', 'example-tube-downloader,missing-output-downloader'], root)

    const products = JSON.parse(
      readFileSync(join(root, 'sites/browserextensions.io/products.json'), 'utf8')
    ) as SiteProducts
    expect(Object.keys(products)).toEqual(['existing-downloader', 'example-tube-downloader'])
    expect(products['example-tube-downloader']?.content?.body).toBe(goodRewrite.body)
    expect(products['missing-output-downloader']).toBeUndefined()
    expect(JSON.stringify(products['example-tube-downloader'])).not.toContain('github.com')
    expect(process.exitCode).toBe(1)
    process.exitCode = 0
    expect(hasPassingOutput(join(root, work), 'example-tube-downloader')).toBe(true)

    // Editing the output invalidates the stored pass.
    writeFileSync(
      join(root, work, 'output/example-tube-downloader.json'),
      JSON.stringify({ ...goodRewrite, tagline: `${goodRewrite.tagline} ` })
    )
    expect(hasPassingOutput(join(root, work), 'example-tube-downloader')).toBe(false)
    writeFileSync(
      join(root, work, 'output/example-tube-downloader.json'),
      JSON.stringify(goodRewrite)
    )
    expect(hasPassingOutput(join(root, work), 'example-tube-downloader')).toBe(true)

    await main(
      ['prepare', '--source-dir', join(root, 'store-new'), '--exclude', 'excluded-downloader'],
      root
    )
    expect(readFileSync(join(root, work, 'pending.txt'), 'utf8').trim()).toBe(
      'missing-output-downloader'
    )
  })

  it('refuses inputs that skipped link verification or were edited after prepare', async () => {
    root = mkdtempSync(join(tmpdir(), 'listing-rewrite-'))
    const productsDir = join(root, 'store-new/apps/serp-apps/data/products')
    mkdirSync(productsDir, { recursive: true })
    mkdirSync(join(root, 'sites/browserextensions.io'), { recursive: true })
    writeFileSync(
      join(productsDir, 'example-tube-downloader.json'),
      JSON.stringify(sourceProduct())
    )
    writeFileSync(
      join(root, 'sites/browserextensions.io/products.json'),
      JSON.stringify({
        legal: {
          content: { body: 'x', faq: [{ answer: LEGAL_ANSWER, question: 'Is this legal?' }] }
        }
      })
    )
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const work = join(root, 'tmp/listing-rewrites')

    await main(['prepare', '--no-verify-links', '--source-dir', join(root, 'store-new')], root)
    mkdirSync(join(work, 'output'), { recursive: true })
    writeFileSync(join(work, 'output/example-tube-downloader.json'), JSON.stringify(goodRewrite))
    await main(['apply'], root)
    let products = JSON.parse(
      readFileSync(join(root, 'sites/browserextensions.io/products.json'), 'utf8')
    ) as SiteProducts
    expect(products['example-tube-downloader']).toBeUndefined()
    expect(process.exitCode).toBe(1)

    const inputPath = join(work, 'input/example-tube-downloader.json')
    const input = JSON.parse(readFileSync(inputPath, 'utf8')) as RewriteInput
    writeFileSync(inputPath, JSON.stringify({ ...input, facts: { ...input.facts, browsers: [] } }))
    await main(['apply', '--exclude', 'nothing'], root)
    products = JSON.parse(
      readFileSync(join(root, 'sites/browserextensions.io/products.json'), 'utf8')
    ) as SiteProducts
    expect(products['example-tube-downloader']).toBeUndefined()
    const check = JSON.parse(
      readFileSync(join(work, 'check/example-tube-downloader.json'), 'utf8')
    ) as { issues: string[] }
    expect(check.issues).toEqual(['input file changed since prepare (re-run prepare)'])
  })
})
