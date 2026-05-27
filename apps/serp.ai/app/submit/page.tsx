import { GitHubIssueSubmitForm } from '@thedaviddias/web-core/forms/github-issue-submit-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit to SERP AI',
  description: 'Submit your AI product, company, model, dataset, or resource to SERP AI.'
}

export default function SubmitPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <GitHubIssueSubmitForm />
    </main>
  )
}
