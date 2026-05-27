import { categories, normalizeCategorySlug } from '@thedaviddias/web-core/categories'
import { GitHubIssueSubmitForm } from '@thedaviddias/web-core/forms/github-issue-submit-form'
import { fireEvent, render, screen, waitFor } from '@/test/test-utils'

describe('GitHubIssueSubmitForm', () => {
  it('uses neutral starter copy for the submit flow', () => {
    render(<GitHubIssueSubmitForm />)

    expect(screen.getByRole('heading', { name: /submit a listing/i })).toBeInTheDocument()
    expect(screen.queryByText(/open a public github issue/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/submissions are public/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/submission tips/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/before you submit/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/optional links/i)).not.toBeInTheDocument()
    expect(screen.getByText(/github issue submission is disabled/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/website url/i)).toHaveValue('https://')
    expect(screen.getByLabelText(/logo url/i)).toHaveValue('https://')
    expect(screen.queryByLabelText(/screenshot url/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/video url/i)).toHaveValue('https://')
    expect(screen.getByLabelText(/faq question/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/faq answer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/resource link url/i)).toHaveValue('https://')
    expect(screen.getByLabelText(/^name$/i)).toBeRequired()
    expect(screen.getByLabelText(/category/i)).toBeRequired()
    expect(screen.getByLabelText(/website url/i)).toBeRequired()
    expect(screen.getByLabelText(/logo url/i)).toBeRequired()
    expect(screen.getByLabelText(/video url/i)).toBeRequired()
    expect(screen.getByLabelText(/short description/i)).toBeRequired()
    expect(screen.getByLabelText(/full description/i)).toBeRequired()
    expect(screen.getByLabelText(/faq question/i)).toBeRequired()
    expect(screen.getByLabelText(/faq answer/i)).toBeRequired()
    expect(screen.getByLabelText(/resource link label/i)).toBeRequired()
    expect(screen.getByLabelText(/resource link url/i)).toBeRequired()
    expect(screen.getByRole('button', { name: /remove faq/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /remove link/i })).toBeDisabled()
    expect(screen.queryByLabelText(/llms/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/project name/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /llmstxt\\.org/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue on github/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^submit$/i })).toBeDisabled()
  })

  it('dedupes category choices by canonical category slug', () => {
    render(<GitHubIssueSubmitForm />)

    const categorySelect = screen.getByLabelText(/category/i)
    const optionValues = Array.from(categorySelect.querySelectorAll('option')).map(
      option => option.value
    )
    const categoryOptionValues = optionValues.filter(Boolean)

    expect(screen.getByRole('option', { name: /choose a category/i })).toHaveValue('')
    expect(new Set(categoryOptionValues).size).toBe(categoryOptionValues.length)

    categories.forEach(category => {
      expect(categoryOptionValues).toContain(normalizeCategorySlug(category.slug))
    })
  })

  it('validates url fields with zod-backed form errors', async () => {
    render(<GitHubIssueSubmitForm />)

    const websiteInput = screen.getByLabelText(/website url/i)

    fireEvent.change(websiteInput, { target: { value: 'not-a-url' } })
    fireEvent.blur(websiteInput)

    await waitFor(() => {
      expect(screen.getByText(/valid url/i)).toBeInTheDocument()
    })
  })
})
