import { describe, expect, it } from 'vitest'
import { buildTrialWebsiteEntries } from './trial-build.ts'

describe('buildTrialWebsiteEntries', () => {
  it('maps trial product data into the website JSON shape used by the app', () => {
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
        category: 'automation-workflow',
        content: expect.stringContaining('Offline use cases'),
        description: 'Download videos from ExampleVideo in one click.',
        favicon: 'https://www.google.com/s2/favicons?domain=serp.ly&sz=128',
        featured: true,
        name: 'SERP Example Downloader',
        publishedAt: '2026-03-23',
        resourceLinks: [
          {
            label: 'Help Center',
            url: 'https://help.serp.co/en/'
          }
        ],
        slug: 'example-downloader',
        website: 'https://serp.ly/example-downloader'
      }
    ])
  })
})
