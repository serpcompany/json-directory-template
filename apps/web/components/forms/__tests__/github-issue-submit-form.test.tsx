import { render, screen } from '@/test/test-utils'
import { GitHubIssueSubmitForm } from '@/components/forms/github-issue-submit-form'
import { categories } from '@/lib/categories'

describe('GitHubIssueSubmitForm', () => {
  it('uses neutral starter copy for the submit flow', () => {
    render(<GitHubIssueSubmitForm />)

    expect(screen.getByRole('heading', { name: /submit a website/i })).toBeInTheDocument()
    expect(screen.getByText(/reviewed through github issues/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue on github/i })).toBeDisabled()
  })

  it('derives category choices from the canonical category taxonomy', () => {
    render(<GitHubIssueSubmitForm />)

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
