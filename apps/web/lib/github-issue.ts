import { siteCopy } from '@/lib/site-copy'
import { siteConfig } from '@/lib/site-config'

export interface SubmissionIssueInput {
  category: string
  description: string
  llmsFullUrl?: string
  llmsUrl: string
  name: string
  notes?: string
  website: string
}

function buildIssueBody(input: SubmissionIssueInput): string {
  const listingLabel = siteCopy.listingName.singularTitle
  const lines = [
    `## ${listingLabel} details`,
    '',
    `Name: ${input.name}`,
    `${listingLabel} URL: ${input.website}`,
    `llms.txt URL: ${input.llmsUrl}`,
    `Category: ${input.category}`,
    '',
    '## Description',
    '',
    input.description
  ]

  if (input.llmsFullUrl) {
    lines.push('', `llms-full URL: ${input.llmsFullUrl}`)
  }

  if (input.notes) {
    lines.push('', '## Additional notes', '', input.notes)
  }

  return lines.join('\n')
}

export function buildSubmissionIssueUrl(input: SubmissionIssueInput): string {
  const url = new URL(
    `https://github.com/${siteConfig.githubIssueOwner}/${siteConfig.githubIssueRepo}/issues/new`
  )

  url.searchParams.set('template', siteConfig.githubIssueTemplate)
  url.searchParams.set('title', `Submit ${siteCopy.listingName.singularTitle}: ${input.name}`)
  url.searchParams.set('body', buildIssueBody(input))

  return url.toString()
}
