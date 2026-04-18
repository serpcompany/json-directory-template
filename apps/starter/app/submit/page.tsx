'use client'

import { GitHubIssueSubmitForm } from '@thedaviddias/web-core/forms/github-issue-submit-form'

export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <GitHubIssueSubmitForm />
      </div>
    </div>
  )
}
