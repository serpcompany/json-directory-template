import { siteConfig } from './site-config'
import { siteCopy } from './site-copy'

export interface SubmissionIssueInput {
  category: string
  description: string
  logoUrl?: string
  name: string
  notes?: string
  videoUrl?: string
  website: string
}

function buildIssueBody(input: SubmissionIssueInput): string {
  const listingLabel = siteCopy.listingName.singularTitle
  const lines = [
    `## ${listingLabel} details`,
    '',
    `Name: ${input.name}`,
    `${listingLabel} URL: ${input.website}`,
    `Category: ${input.category}`,
    `Logo URL: ${input.logoUrl || ''}`
  ]

  if (input.videoUrl) {
    lines.push(`Video URL: ${input.videoUrl}`)
  }

  lines.push('', '## Short Description', '', input.description)

  if (input.notes) {
    lines.push('', '## Full Description', '', input.notes)
  }

  return lines.join('\n')
}

export function buildSubmissionIssueUrl(input: SubmissionIssueInput): string {
  if (!siteConfig.githubIssueOwner || !siteConfig.githubIssueRepo) {
    throw new Error('GitHub issue target is not configured for this site.')
  }

  const url = new URL(
    `https://github.com/${siteConfig.githubIssueOwner}/${siteConfig.githubIssueRepo}/issues/new`
  )

  url.searchParams.set('title', `Submit ${siteCopy.listingName.singularTitle}: ${input.name}`)
  url.searchParams.set('body', buildIssueBody(input))

  return url.toString()
}
