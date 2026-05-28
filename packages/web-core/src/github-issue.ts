import { siteConfig } from './site-config'
import { siteCopy } from './site-copy'

export interface SubmissionIssueInput {
  category: string
  description: string
  faqs?: Array<{
    answer: string
    question: string
  }>
  logoUrl?: string
  name: string
  notes?: string
  resourceLinks?: Array<{
    label: string
    url: string
  }>
  videoUrl?: string
  website: string
}

function formatResourceLink(link: { label: string; url: string }): string | null {
  const label = link.label.trim()
  const url = link.url.trim()

  if (!label && !url) {
    return null
  }

  if (label && url) {
    return `- ${label}: ${url}`
  }

  return `- ${label || url}`
}

function isPresent(value: string | null): value is string {
  return value !== null
}

function formatFaq(faq: { answer: string; question: string }): string | null {
  const answer = faq.answer.trim()
  const question = faq.question.trim()

  if (!answer && !question) {
    return null
  }

  return [`### ${question || 'Untitled question'}`, '', answer || '_No answer provided._'].join(
    '\n'
  )
}

function buildIssueBody(input: SubmissionIssueInput): string {
  const listingLabel = siteCopy.listingName.singularTitle
  const faqs = input.faqs?.map(formatFaq).filter(isPresent) ?? []
  const logoUrl = input.logoUrl?.trim()
  const resourceLinks = input.resourceLinks?.map(formatResourceLink).filter(isPresent) ?? []
  const videoUrl = input.videoUrl?.trim()
  const lines = [
    '## Submission visibility',
    '',
    `This submission will be filed as a public GitHub issue for ${siteConfig.name}. Do not include secrets, private credentials, or non-public launch details.`,
    '',
    `Submissions are reviewed manually. Accepted ${siteCopy.listingName.plural} are added by maintainers through the private source repo's normal pull request, validation, build, and deploy process.`,
    '',
    `## ${listingLabel} details`,
    '',
    `Name: ${input.name}`,
    `${listingLabel} URL: ${input.website}`,
    `Category: ${input.category}`,
    '',
    '## Description',
    '',
    input.description
  ]

  if (logoUrl || videoUrl) {
    lines.push('', '## Media', '')

    if (logoUrl) {
      lines.push(`Logo URL: ${logoUrl}`)
    }

    if (videoUrl) {
      lines.push(`Video URL: ${videoUrl}`)
    }
  }

  if (resourceLinks.length > 0) {
    lines.push('', '## Resource links', '', ...resourceLinks)
  }

  if (faqs.length > 0) {
    lines.push('', '## FAQs', '', ...faqs)
  }

  const notes = input.notes?.trim()

  if (notes) {
    lines.push('', '## Additional notes', '', notes)
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
