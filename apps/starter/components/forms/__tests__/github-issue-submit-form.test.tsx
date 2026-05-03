import { render, screen } from '@/test/test-utils'
import { GitHubIssueSubmitForm } from '@thedaviddias/web-core/forms/github-issue-submit-form'
import { categories } from '@thedaviddias/web-core/categories'

describe('GitHubIssueSubmitForm', () => {
  it('uses neutral starter copy for the submit flow', () => {
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    expect(screen.getByRole('heading', { name: /submit a listing/i })).toBeInTheDocument()
    expect(screen.getByText(/receive a token to track your submission status/i)).toBeInTheDocument()
    expect(
      screen.getByText(/github fallback submission is disabled/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/llms/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/project name/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /llmstxt\\.org/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit listing/i })).toBeDisabled()
  })

  it('derives category choices from the canonical category taxonomy', () => {
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    const categorySelect = screen.getByLabelText(/category/i)
    const optionLabels = Array.from(categorySelect.querySelectorAll('option')).map(option =>
      option.textContent?.trim()
    )

    expect(optionLabels).toContain('Choose a category')

    categories.forEach(category => {
      expect(optionLabels).toContain(category.name)
    })
  })
})
