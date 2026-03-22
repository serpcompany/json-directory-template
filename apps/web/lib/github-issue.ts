export interface SubmissionIssueInput {
  category: string
  description: string
  llmsFullUrl?: string
  llmsUrl: string
  name: string
  notes?: string
  website: string
}

const ISSUE_OWNER = 'thedaviddias'
const ISSUE_REPO = 'llms-txt-hub'
const ISSUE_TEMPLATE = 'submit-website.yml'

function buildIssueBody(input: SubmissionIssueInput): string {
  const lines = [
    '## Website details',
    '',
    `Name: ${input.name}`,
    `Website: ${input.website}`,
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
  const url = new URL(`https://github.com/${ISSUE_OWNER}/${ISSUE_REPO}/issues/new`)

  url.searchParams.set('template', ISSUE_TEMPLATE)
  url.searchParams.set('title', `Submit llms.txt: ${input.name}`)
  url.searchParams.set('body', buildIssueBody(input))

  return url.toString()
}
