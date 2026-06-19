import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type SerpAiProduct = {
  media?: {
    images?: string[]
    logo?: string
  }
}

function isRootRelativeAsset(reference: string): boolean {
  return reference.startsWith('/')
}

describe('serp.ai media assets', () => {
  it('does not reference missing root-relative product media', () => {
    const products = JSON.parse(
      readFileSync(resolve(process.cwd(), 'sites/serp.ai/products.json'), 'utf8')
    ) as Record<string, SerpAiProduct>
    const publicRoot = resolve(process.cwd(), 'apps/serp.ai/public')
    const missingReferences: string[] = []

    for (const [slug, product] of Object.entries(products)) {
      const references = [product.media?.logo, ...(product.media?.images ?? [])].filter(
        (reference): reference is string => Boolean(reference)
      )

      for (const reference of references) {
        if (
          isRootRelativeAsset(reference) &&
          !existsSync(resolve(publicRoot, reference.slice(1)))
        ) {
          missingReferences.push(`${slug}: ${reference}`)
        }
      }
    }

    expect(missingReferences).toEqual([])
  })
})
