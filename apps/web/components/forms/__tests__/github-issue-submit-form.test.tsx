import { render, screen } from '@/test/test-utils'
import { GitHubIssueSubmitForm } from '@/components/forms/github-issue-submit-form'

describe('GitHubIssueSubmitForm', () => {
  it('uses neutral starter copy for the submit flow', () => {
    render(<GitHubIssueSubmitForm />)

    expect(screen.getByRole('heading', { name: /submit a website/i })).toBeInTheDocument()
    expect(screen.getByText(/reviewed through github issues/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue on github/i })).toBeDisabled()
  })
})
