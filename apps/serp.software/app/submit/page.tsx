import { GitHubIssueSubmitForm } from '@thedaviddias/web-core/forms/github-issue-submit-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit a Product',
  description: 'Submit your downloader software product to SERP Software.'
}

export default function SubmitPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <GitHubIssueSubmitForm />
    </main>
  )
}
