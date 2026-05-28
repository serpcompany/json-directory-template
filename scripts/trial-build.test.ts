import { describe, expect, it } from 'vitest'
import { buildTrialWebsiteEntries, canonicalizeTrialProducts } from './trial-build.ts'

describe('buildTrialWebsiteEntries', () => {
  it('maps the lean canonical trial source shape into the website JSON shape used by the app', () => {
    const entries = buildTrialWebsiteEntries(
      {
        'example-downloader': {
          content: {
            body: '## Overview\n\nSave videos from ExampleVideo with one click.',
            faq: [
              {
                answer: 'Yes. It supports current ExampleVideo mirrors.',
                question: 'Does this work on mirrors?'
              }
            ]
          },
          media: {
            images: ['https://cdn.example.com/example-downloader/shot-1.png'],
            logo: 'https://cdn.example.com/example-downloader/logo.png',
            video: 'https://cdn.example.com/example-downloader/demo.mp4'
          },
          product: {
            categories: ['automation-workflow', 'developer-tools'],
            productPage: 'https://serp.ly/example-downloader',
            slug: 'example-downloader',
            tagline: 'Download videos from ExampleVideo in one click.',
            title: 'SERP Example Downloader'
          },
          relatedLinks: [
            {
              label: 'Support',
              url: 'https://support.example.com/example-downloader'
            }
          ]
        }
      },
      {
        category: 'developer-tools',
        publishedAt: '2026-03-24'
      }
    )

    expect(entries).toEqual([
      {
        categories: ['automation-workflow', 'developer-tools'],
        content: expect.stringContaining('## FAQ'),
        description: 'Download videos from ExampleVideo in one click.',
        favicon: 'https://www.google.com/s2/favicons?domain=serp.ly&sz=128',
        featured: true,
        media: {
          images: ['https://cdn.example.com/example-downloader/shot-1.png'],
          logo: 'https://cdn.example.com/example-downloader/logo.png',
          video: 'https://cdn.example.com/example-downloader/demo.mp4'
        },
        name: 'SERP Example Downloader',
        publishedAt: '2026-03-24',
        resourceLinks: [
          {
            label: 'Support',
            url: 'https://support.example.com/example-downloader'
          }
        ],
        slug: 'example-downloader',
        website: 'https://serp.ly/example-downloader'
      }
    ])
  })

  it('does not expose generic GitHub organization links as listing resource links', () => {
    const [entry] = buildTrialWebsiteEntries(
      {
        'example-downloader': {
          product: {
            productPage: 'https://serp.ly/example-downloader',
            slug: 'example-downloader',
            tagline: 'Download videos from ExampleVideo in one click.',
            title: 'SERP Example Downloader'
          },
          relatedLinks: [
            {
              label: 'Github',
              url: 'https://github.com/serpapps'
            },
            {
              label: 'Release Notes',
              url: 'https://example.com/example-downloader/releases'
            }
          ]
        }
      },
      {
        category: 'developer-tools',
        publishedAt: '2026-03-24'
      }
    )

    expect(entry.resourceLinks).toEqual([
      {
        label: 'Release Notes',
        url: 'https://example.com/example-downloader/releases'
      }
    ])
  })

  it('omits the links section data when a trial product only has generic GitHub organization links', () => {
    const [entry] = buildTrialWebsiteEntries(
      {
        'example-downloader': {
          product: {
            productPage: 'https://serp.ly/example-downloader',
            slug: 'example-downloader',
            tagline: 'Download videos from ExampleVideo in one click.',
            title: 'SERP Example Downloader'
          },
          relatedLinks: [
            {
              label: 'Github',
              url: 'https://github.com/serpapps'
            }
          ]
        }
      },
      {
        category: 'developer-tools',
        publishedAt: '2026-03-24'
      }
    )

    expect(entry.resourceLinks).toBeUndefined()
  })

  it('uses the first category as the primary route category when only categories are provided', () => {
    const [entry] = buildTrialWebsiteEntries(
      {
        'example-downloader': {
          product: {
            categories: ['developer-tools', 'video-downloaders'],
            productPage: 'https://serp.ly/example-downloader',
            slug: 'example-downloader',
            tagline: 'Download videos from ExampleVideo in one click.',
            title: 'SERP Example Downloader'
          }
        }
      },
      {
        category: 'video-downloaders',
        publishedAt: '2026-03-24'
      }
    )

    expect(entry).toMatchObject({
      categories: ['developer-tools', 'video-downloaders']
    })
  })

  it('preserves an explicit featured flag from canonical trial products', () => {
    const entries = buildTrialWebsiteEntries(
      {
        'featured-video-downloader': {
          featured: true,
          product: {
            categories: ['video-downloaders'],
            productPage: 'https://serp.ly/featured-video-downloader',
            slug: 'featured-video-downloader',
            tagline: 'Download videos from FeaturedVideo in one click.',
            title: 'Featured Video Downloader'
          }
        },
        'regular-image-downloader': {
          product: {
            categories: ['image-downloaders'],
            productPage: 'https://serp.ly/regular-image-downloader',
            slug: 'regular-image-downloader',
            tagline: 'Download images from RegularImage in one click.',
            title: 'Regular Image Downloader'
          }
        }
      },
      {
        category: 'other',
        featuredCount: 0,
        publishedAt: '2026-03-24'
      }
    )

    expect(entries).toEqual([
      expect.objectContaining({
        featured: true,
        slug: 'featured-video-downloader'
      }),
      expect.objectContaining({
        featured: false,
        slug: 'regular-image-downloader'
      })
    ])
  })

  it('keeps legacy nested trial product compatibility during the transition', () => {
    const entries = buildTrialWebsiteEntries(
      {
        'example-downloader': {
          contentMarketing: {
            productPositioning: {
              elevatorPitch: 'Save videos from ExampleVideo with one click.',
              useCases: ['Archive videos for offline viewing.'],
              valueProposition: 'Built specifically for ExampleVideo downloads.'
            },
            storeListingCopy: {
              shortDescription: 'Download videos from ExampleVideo in one click.'
            }
          },
          technicalInfo: {
            coreIdentity: {
              extensionName: 'SERP Example Downloader',
              slug: 'example-downloader'
            },
            storeAndDistribution: {
              helpCenter: 'https://help.serp.co/en/',
              productPage: 'https://serp.ly/example-downloader'
            }
          }
        }
      },
      {
        category: 'automation-workflow',
        publishedAt: '2026-03-23'
      }
    )

    expect(entries).toEqual([
      {
        categories: ['automation-workflow'],
        content: expect.stringContaining('Offline use cases'),
        description: 'Download videos from ExampleVideo in one click.',
        favicon: 'https://www.google.com/s2/favicons?domain=serp.ly&sz=128',
        featured: true,
        name: 'SERP Example Downloader',
        publishedAt: '2026-03-23',
        slug: 'example-downloader',
        website: 'https://serp.ly/example-downloader'
      }
    ])
  })

  it('can rewrite legacy trial product data into the lean canonical source shape', () => {
    const products = canonicalizeTrialProducts(
      {
        'example-downloader': {
          contentMarketing: {
            productPositioning: {
              elevatorPitch: 'Save videos from ExampleVideo with one click.',
              useCases: ['Archive videos for offline viewing.'],
              valueProposition: 'Built specifically for ExampleVideo downloads.'
            },
            storeListingCopy: {
              faq: [
                {
                  answer: 'Yes. It supports current ExampleVideo mirrors.',
                  question: 'Does this work on mirrors?'
                }
              ],
              shortDescription: 'Download videos from ExampleVideo in one click.'
            }
          },
          technicalInfo: {
            coreIdentity: {
              extensionName: 'SERP Example Downloader',
              slug: 'example-downloader'
            },
            storeAndDistribution: {
              helpCenter: 'https://help.serp.co/en/',
              productPage: 'https://serp.ly/example-downloader'
            }
          }
        }
      },
      {
        defaultCategory: 'automation-workflow'
      }
    )

    expect(products).toEqual({
      'example-downloader': {
        content: {
          body: expect.stringContaining('## Offline use cases'),
          faq: [
            {
              answer: 'Yes. It supports current ExampleVideo mirrors.',
              question: 'Does this work on mirrors?'
            }
          ]
        },
        product: {
          productPage: 'https://serp.ly/example-downloader',
          slug: 'example-downloader',
          tagline: 'Download videos from ExampleVideo in one click.',
          title: 'SERP Example Downloader'
        }
      }
    })
  })

  it('preserves non-banned legacy help center links in the canonical source shape', () => {
    const products = canonicalizeTrialProducts(
      {
        'example-downloader': {
          contentMarketing: {
            productPositioning: {
              elevatorPitch: 'Save videos from ExampleVideo with one click.'
            },
            storeListingCopy: {
              shortDescription: 'Download videos from ExampleVideo in one click.'
            }
          },
          technicalInfo: {
            coreIdentity: {
              extensionName: 'SERP Example Downloader',
              slug: 'example-downloader'
            },
            storeAndDistribution: {
              helpCenter: 'https://help.serp.co/fr/',
              productPage: 'https://serp.ly/example-downloader'
            }
          }
        }
      },
      {
        defaultCategory: 'automation-workflow'
      }
    )

    expect(products['example-downloader']?.relatedLinks).toEqual([
      {
        label: 'Help Center',
        url: 'https://help.serp.co/fr/'
      }
    ])
  })

  it('keeps explicit primary and secondary categories in the canonical source shape', () => {
    const products = canonicalizeTrialProducts(
      {
        'example-downloader': {
          product: {
            categories: ['video-downloaders', 'developer-tools'],
            productPage: 'https://serp.ly/example-downloader',
            slug: 'example-downloader',
            tagline: 'Download videos from ExampleVideo in one click.',
            title: 'SERP Example Downloader'
          }
        }
      },
      {
        defaultCategory: 'video-downloaders'
      }
    )

    expect(products).toEqual({
      'example-downloader': {
        product: {
          categories: ['video-downloaders', 'developer-tools'],
          productPage: 'https://serp.ly/example-downloader',
          slug: 'example-downloader',
          tagline: 'Download videos from ExampleVideo in one click.',
          title: 'SERP Example Downloader'
        }
      }
    })
  })

  it('drops legacy design and implementation config from the canonical source shape', () => {
    const products = canonicalizeTrialProducts(
      {
        'example-downloader': {
          brandBackgroundHex: '#000000',
          brandColorHex: '#ffffff',
          brandColors: {
            primary: '#ffffff'
          },
          buildAndRelease: {
            releaseChannel: 'stable'
          },
          businessAndMonetization: {
            footerCta: 'Upgrade now'
          },
          contentMarketing: {
            productPositioning: {
              elevatorPitch: 'Save videos from ExampleVideo with one click.',
              useCases: ['Archive videos for offline viewing.'],
              valueProposition: 'Built specifically for ExampleVideo downloads.'
            },
            storeListingCopy: {
              shortDescription: 'Download videos from ExampleVideo in one click.'
            }
          },
          contentScripts: {
            matches: ['*://example.com/*']
          },
          contextMenu: {
            enabled: true
          },
          downloadManagerPanel: {
            enabled: true
          },
          extension: 'example-downloader',
          footerCta: {
            label: 'Get started'
          },
          geckoId: 'example@example.com',
          hostPermissions: ['*://example.com/*'],
          loggingAndTelemetry: {
            enabled: true
          },
          playerButtonConfig: {
            visible: true
          },
          popupUI: {
            title: 'Example Downloader'
          },
          technicalInfo: {
            coreIdentity: {
              extensionName: 'SERP Example Downloader',
              slug: 'example-downloader'
            },
            storeAndDistribution: {
              helpCenter: 'https://help.serp.co/en/',
              productPage: 'https://serp.ly/example-downloader'
            }
          },
          technicalDetails: {
            runtime: 'mv3'
          },
          testingAndHealth: {
            status: 'green'
          },
          versionAndStatus: {
            version: '1.0.0'
          }
        }
      },
      {
        defaultCategory: 'automation-workflow'
      }
    )

    expect(products).toEqual({
      'example-downloader': {
        content: {
          body: expect.stringContaining('## Offline use cases')
        },
        product: {
          productPage: 'https://serp.ly/example-downloader',
          slug: 'example-downloader',
          tagline: 'Download videos from ExampleVideo in one click.',
          title: 'SERP Example Downloader'
        }
      }
    })
  })

  it('escapes mdx expression characters in plain-text content sections', () => {
    const [entry] = buildTrialWebsiteEntries(
      {
        'coomer-downloader': {
          content: {
            body: 'Save videos and images from creator pages.',
            faq: [
              {
                answer:
                  'All files save to a Coomer Downloader/{creator name}/{date - title} folder structure.',
                question: 'Where are my downloads saved?'
              }
            ]
          },
          product: {
            productPage: 'https://serp.ly/coomer-downloader',
            slug: 'coomer-downloader',
            tagline: 'Download creator content for offline viewing.',
            title: 'Coomer Downloader'
          }
        }
      },
      {
        category: 'automation-workflow',
        publishedAt: '2026-03-24'
      }
    )

    expect(entry.content).toContain(
      'Coomer Downloader/\\{creator name\\}/\\{date - title\\} folder structure.'
    )
  })
})
