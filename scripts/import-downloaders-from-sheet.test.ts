import { describe, expect, it } from 'vitest'
import {
  ACTIVE_DOWNLOADER_SITE_IDS,
  buildDownloaderProduct,
  mergeDownloaderProducts,
  parseDownloaderRows,
  parseProductReadme,
  validateDownloaderImport
} from './import-downloaders-from-sheet.ts'

const csvHeader =
  'product_key,status,site_is_adult,site,product_name,product_website_link_serp.ly,product_website_link_serpx.link,gh_repo_public_seo,gh_private_source_code_repo'

const sampleCsv = `${csvHeader}
example-downloader,live,TRUE,example.com,Example Video Downloader,https://serp.ly/example-downloader,https://serpx.link/example-downloader,,https://github.com/serpcompany/example-downloader
second-downloader,live,TRUE,second.example,Second Video Downloader,https://serp.ly/second-downloader,https://serpx.link/second-downloader,,https://github.com/serpcompany/second-downloader
`

const sampleReadme = `# Example Downloader (Browser Extension)

> Download Example videos with a browser-based workflow.

Example Downloader is a browser extension for saving videos from Example.com as standard video files. Open a supported page, press play if needed, choose an available format, and save through your browser.

- Purpose-built around Example playback pages
- Quality selection where source variants are available

## Links

- :rocket: Get it here: [Example Downloader](https://serp.ly/example-downloader)
- :new: Latest release: [GitHub Releases](https://github.com/serpapps/example-downloader/releases/latest)
- :question: Help center: [SERP Help](https://help.serp.co/en/)

## Preview

![Example Downloader workflow preview](assets/workflow-preview.svg)

## Table of Contents

- [Why Example Downloader](#why-example-downloader)
- [Features](#features)
- [FAQ](#faq)

## Why Example Downloader

Example pages do not always expose a direct download button. This extension detects available media candidates from the page.

## Features

- Detects video streams on Example pages automatically
- Saves videos as standard MP4 files for local playback

## FAQ

**How do I download an Example video?**
Open a supported Example video page, press play, then use the extension popup.

**What formats can it detect?**
The extension normalizes direct MP4 and HLS/M3U8-style media URLs when they are exposed by the page.

**Where are downloads saved?**
Downloads are saved through your browser download flow.

**How do I get help?**
Report issues on GitHub instead of linking to https://help.serp.co/en/.

## License

This repository is distributed under the proprietary SERP Apps license.
`

describe('parseDownloaderRows', () => {
  it('parses and validates required downloader CSV fields', () => {
    const rows = parseDownloaderRows(sampleCsv, { expectedRowCount: 2 })

    expect(rows).toEqual([
      expect.objectContaining({
        githubSourceRepo: 'https://github.com/serpcompany/example-downloader',
        productName: 'Example Video Downloader',
        serpLyUrl: 'https://serp.ly/example-downloader',
        serpXUrl: 'https://serpx.link/example-downloader',
        slug: 'example-downloader'
      }),
      expect.objectContaining({
        slug: 'second-downloader'
      })
    ])
  })

  it('fails when the sheet has the wrong row count', () => {
    expect(() => parseDownloaderRows(sampleCsv, { expectedRowCount: 214 })).toThrow(
      /Expected 214 downloader rows, found 2/
    )
  })

  it('fails on duplicate product keys', () => {
    const duplicateCsv = `${sampleCsv}example-downloader,live,TRUE,example.com,Example Video Downloader,https://serp.ly/example-downloader,https://serpx.link/example-downloader,,https://github.com/serpcompany/example-downloader
`

    expect(() => parseDownloaderRows(duplicateCsv)).toThrow(
      /Duplicate product_key values: example-downloader/
    )
  })
})

describe('parseProductReadme', () => {
  it('extracts README-backed tagline, body, faq, and links', () => {
    const readme = parseProductReadme(sampleReadme)

    expect(readme.tagline).toBe('Download Example videos with a browser-based workflow.')
    expect(readme.body).toContain('## Overview')
    expect(readme.body).toContain('Example Downloader is a browser extension')
    expect(readme.body).toContain('## Why Example Downloader')
    expect(readme.body).toContain('## Features')
    expect(readme.body).not.toContain('## Links')
    expect(readme.body).not.toContain('## FAQ')
    expect(readme.faq).toHaveLength(3)
    expect(readme.faq.map(item => item.answer).join('\n')).not.toContain('help.serp.co/en')
    expect(readme.relatedLinks).toEqual([
      {
        label: 'Latest Release',
        url: 'https://github.com/serpapps/example-downloader/releases/latest'
      }
    ])
  })
})

describe('buildDownloaderProduct', () => {
  it('builds a canonical product from CSV identity and README content', () => {
    const [row] = parseDownloaderRows(sampleCsv, { expectedRowCount: 2 })
    const readme = parseProductReadme(sampleReadme)

    const product = buildDownloaderProduct(row, readme, {
      categories: ['adult', 'video-downloaders'],
      featured: true
    })

    expect(product).toMatchObject({
      featured: true,
      product: {
        categories: ['adult', 'video-downloaders'],
        productPage: 'https://serp.ly/example-downloader',
        slug: 'example-downloader',
        tagline: 'Download Example videos with a browser-based workflow.',
        title: 'Example Video Downloader'
      }
    })
    expect(product.content?.body).toContain('## Overview')
    expect(product.content?.faq).toHaveLength(3)
    expect(product.relatedLinks).toEqual([
      {
        label: 'Install browser extension',
        url: 'https://serp.ly/example-downloader'
      },
      {
        label: 'SERPX',
        url: 'https://serpx.link/example-downloader'
      },
      {
        label: 'SERP',
        url: 'https://serp.co/products/example-downloader/reviews/'
      },
      {
        label: 'SERP AI',
        url: 'https://serp.ai/products/example-downloader/reviews/'
      },
      {
        label: 'Browser Extensions',
        url: 'https://browserextensions.io/products/example-downloader/'
      },
      {
        label: 'Latest Release',
        url: 'https://github.com/serpapps/example-downloader/releases/latest'
      }
    ])
  })
})

describe('mergeDownloaderProducts', () => {
  it('drops empty legacy media objects while preserving the existing product', () => {
    const existing = {
      'legacy-downloader': {
        media: {},
        product: {
          productPage: 'https://serp.ly/legacy-downloader',
          slug: 'legacy-downloader',
          tagline: 'Legacy tagline',
          title: 'Legacy Downloader'
        }
      }
    }

    expect(mergeDownloaderProducts(existing, {})).toEqual({
      'legacy-downloader': {
        product: {
          productPage: 'https://serp.ly/legacy-downloader',
          slug: 'legacy-downloader',
          tagline: 'Legacy tagline',
          title: 'Legacy Downloader'
        }
      }
    })
  })

  it('updates matching slugs without replacing richer existing content with poorer imports', () => {
    const existing = {
      'example-downloader': {
        content: {
          body: '## Overview\n\nExisting richer body.\n\n## Key Features\n\n- Existing feature',
          faq: [
            { answer: 'Existing answer 1', question: 'Existing question 1?' },
            { answer: 'Existing answer 2', question: 'Existing question 2?' },
            { answer: 'Existing answer 3', question: 'Existing question 3?' }
          ]
        },
        product: {
          productPage: 'https://serp.ly/old-example-downloader',
          slug: 'example-downloader',
          tagline: 'Existing richer tagline',
          title: 'Old Example Downloader'
        }
      }
    }
    const imported = {
      'example-downloader': {
        content: {
          body: '## Overview\n\nShort.',
          faq: [{ answer: 'New answer', question: 'New question?' }]
        },
        product: {
          productPage: 'https://serp.ly/example-downloader',
          slug: 'example-downloader',
          tagline: 'New tagline',
          title: 'Example Video Downloader'
        }
      }
    }

    expect(mergeDownloaderProducts(existing, imported)).toEqual({
      'example-downloader': {
        content: existing['example-downloader'].content,
        product: {
          productPage: 'https://serp.ly/example-downloader',
          slug: 'example-downloader',
          tagline: 'Existing richer tagline',
          title: 'Example Video Downloader'
        }
      }
    })
  })
})

describe('validateDownloaderImport', () => {
  it('allows serp.software to keep site-specific rewritten product copy after import', () => {
    expect(ACTIVE_DOWNLOADER_SITE_IDS).toEqual([
      'browserextensions.io',
      'serp.co',
      'serp.ai',
      'serpdownloaders.com',
      'serp.software',
      'pornvideodownloaders.com'
    ])

    expect(() => {
      validateDownloaderImport({
        'browserextensions.io': {},
        'pornvideodownloaders.com': {},
        'serp.ai': {},
        'serp.co': {},
        'serp.software': {
          'example-downloader': {
            content: {
              body: '## Overview\n\nNeutral software-directory copy.'
            },
            product: {
              productPage: 'https://serp.ly/example-downloader',
              slug: 'example-downloader',
              tagline: 'Software-directory tagline',
              title: 'Example'
            }
          }
        },
        'serpdownloaders.com': {
          'example-downloader': {
            content: {
              body: '## Overview\n\nDownloader-specific copy.'
            },
            product: {
              productPage: 'https://serp.ly/example-downloader',
              slug: 'example-downloader',
              tagline: 'Downloader-directory tagline',
              title: 'Example'
            }
          }
        }
      })
    }).not.toThrow()
  })
})
