import 'server-only'

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveCheckedInSiteConfig } from '@thedaviddias/site-contract'
import type { CheckedInSiteConfig } from '@thedaviddias/site-contract/types'
import { canonicalizeTrialProducts, type TrialProducts } from '../../../scripts/trial-build'
import { resolveFromRoot } from '@/lib/server-utils'
import {
  operatorOnboardingDocumentSchema,
  operatorSiteDocumentSchema,
  type OperatorOnboardingDocument,
  type OperatorOnboardingSiteDocument
} from '@/lib/operator-onboarding'

function toOperatorSiteDocument(
  siteConfig: CheckedInSiteConfig,
  fallbackCategory = 'other'
): OperatorOnboardingSiteDocument {
  const defaultCategory =
    siteConfig.content.listingSource.kind === 'trial-products-json'
      ? siteConfig.content.listingSource.category
      : fallbackCategory
  const featuredCount =
    siteConfig.content.listingSource.kind === 'trial-products-json'
      ? siteConfig.content.listingSource.featuredCount
      : 6
  const publishedAt =
    siteConfig.content.listingSource.kind === 'trial-products-json'
      ? siteConfig.content.listingSource.publishedAt
      : new Date().toISOString().slice(0, 10)

  return operatorSiteDocumentSchema.parse({
    categoryLabels: siteConfig.copy.categoryLabels,
    defaultCategory,
    description: siteConfig.site.description,
    docsLabel: siteConfig.copy.docsLabel,
    docsRouteBasePath: siteConfig.routes.docsBasePath,
    domain: siteConfig.site.domain,
    featuredCount,
    githubIssueOwner: siteConfig.social.githubIssueOwner,
    githubIssueRepo: siteConfig.social.githubIssueRepo,
    githubIssuesUrl: siteConfig.social.githubIssuesUrl,
    githubRepoUrl: siteConfig.social.githubRepoUrl,
    githubUrl: siteConfig.social.githubUrl,
    listingPluralLabel: siteConfig.copy.listingName.plural,
    listingRouteBasePath: siteConfig.routes.listingBasePath,
    listingSingularLabel: siteConfig.copy.listingName.singular,
    name: siteConfig.site.name,
    networkLabel: siteConfig.copy.networkLabel,
    networkRouteBasePath: siteConfig.routes.networkBasePath,
    publicUrl: siteConfig.site.publicUrl,
    publishedAt,
    redditUrl: siteConfig.social.redditUrl,
    siteId: siteConfig.id,
    submitLabel: siteConfig.copy.submitLabel,
    tagline: siteConfig.site.tagline,
    twitterUrl: siteConfig.social.twitterUrl
  })
}

export function buildOperatorOnboardingDocument(input: {
  products: TrialProducts
  siteConfig: CheckedInSiteConfig
}): OperatorOnboardingDocument {
  const canonicalProducts = canonicalizeTrialProducts(input.products, {
    defaultCategory:
      input.siteConfig.content.listingSource.kind === 'trial-products-json'
        ? input.siteConfig.content.listingSource.category
        : undefined
  })
  const fallbackCategory = Object.values(canonicalProducts)[0]?.product.categories?.[0] || 'other'

  return operatorOnboardingDocumentSchema.parse({
    listings: Object.values(canonicalProducts),
    site: toOperatorSiteDocument(input.siteConfig, fallbackCategory)
  })
}

export function resolveOperatorSourcePath(relativePath: string, cwd = process.cwd()): string {
  const candidates = [
    resolve(cwd, relativePath),
    resolve(cwd, '..', '..', relativePath),
    resolve(cwd, '..', relativePath),
    resolveFromRoot(relativePath)
  ]

  const matchedPath = candidates.find(candidate => existsSync(candidate))

  if (!matchedPath) {
    throw new Error(`Could not resolve operator source path for ${relativePath}`)
  }

  return matchedPath
}

export function loadOperatorOnboardingDocument(siteId?: string): OperatorOnboardingDocument {
  const siteConfig = resolveCheckedInSiteConfig(siteId)

  if (siteConfig.content.listingSource.kind !== 'trial-products-json') {
    throw new Error(
      `Operator onboarding currently supports only trial-products-json sources. ${siteConfig.id} uses ${siteConfig.content.listingSource.kind}.`
    )
  }

  const products = JSON.parse(
    readFileSync(resolveOperatorSourcePath(siteConfig.content.listingSource.path), 'utf8')
  ) as TrialProducts

  return buildOperatorOnboardingDocument({
    products,
    siteConfig
  })
}
