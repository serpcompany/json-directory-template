import { categories } from '@thedaviddias/web-core/categories'
import { GitHubIssueSubmitForm } from '@thedaviddias/web-core/forms/github-issue-submit-form'
import { fireEvent, render, screen, waitFor, within } from '@/test/test-utils'

const firstCategory = categories[0]!

async function fillRequiredFields({
  includeFullDescription = true
}: {
  includeFullDescription?: boolean
} = {}) {
  const { userEvent } = await import('@/test/test-utils')

  await userEvent.type(screen.getByLabelText(/name/i), 'Example Extension')
  await userEvent.selectOptions(screen.getByLabelText(/category/i), firstCategory.slug)
  await userEvent.type(screen.getByLabelText(/website url/i), 'https://example.com')
  await userEvent.type(screen.getByLabelText(/logo url/i), 'https://example.com/logo.png')
  await userEvent.type(
    screen.getByLabelText(/short description/i),
    'A short description for this extension.'
  )

  if (includeFullDescription) {
    await userEvent.type(
      screen.getByLabelText(/full description/i),
      'A complete description for reviewers.'
    )
  }
}

function expectRequiredMarker(label: string) {
  const field = screen.getByLabelText(new RegExp(label, 'i'))
  const labelElement = field.closest('label')
  expect(labelElement).not.toBeNull()
  expect(within(labelElement as HTMLElement).getByText('*')).toHaveClass('text-red-500')
}

function expectNoRequiredMarker(label: string) {
  const field = screen.getByLabelText(new RegExp(label, 'i'))
  const labelElement = field.closest('label')
  expect(labelElement).not.toBeNull()
  expect(within(labelElement as HTMLElement).queryByText('*')).not.toBeInTheDocument()
}

describe('GitHubIssueSubmitForm', () => {
  it('uses neutral starter copy for the submit flow', () => {
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    expect(screen.getByRole('heading', { name: /submit a listing/i })).toBeInTheDocument()
    expect(screen.getByText(/receive a token to track your submission status/i)).toBeInTheDocument()
    expect(screen.getByText(/github fallback submission is disabled/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
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

  it('renders red required markers only for required top-level fields', () => {
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    expectRequiredMarker('name')
    expectRequiredMarker('category')
    expectRequiredMarker('website url')
    expectRequiredMarker('logo url')
    expectRequiredMarker('short description')
    expectRequiredMarker('full description')
    expectNoRequiredMarker('video url')
    expect(screen.getByText('FAQs')).not.toHaveTextContent('*')
    expect(screen.getByText('Resource Links')).not.toHaveTextContent('*')
  })

  it('keeps Full Description required before submission is enabled', async () => {
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    await fillRequiredFields({ includeFullDescription: false })

    expect(screen.getByRole('button', { name: /submit listing/i })).toBeDisabled()
  })

  it('submits when all required fields are filled and Video URL and FAQs are blank', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ token: 'example-token' }),
      ok: true
    })
    global.fetch = fetchMock
    window.fetch = fetchMock
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    await fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: /submit listing/i })
    expect(submitButton).toBeEnabled()

    fireEvent.submit(submitButton.closest('form') as HTMLFormElement)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual(
      expect.objectContaining({
        faqs: [],
        logoUrl: 'https://example.com/logo.png',
        videoUrl: ''
      })
    )
  })

  it('requires both FAQ question and answer when either side is filled', async () => {
    render(<GitHubIssueSubmitForm submitEndpoint="/api/submit" />)

    await fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: /submit listing/i })
    expect(submitButton).toBeEnabled()

    const { userEvent } = await import('@/test/test-utils')
    await userEvent.type(screen.getByPlaceholderText('Question'), 'What browsers are supported?')
    expect(submitButton).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText('Answer'), 'Chrome and Firefox.')
    expect(submitButton).toBeEnabled()
  })
})
