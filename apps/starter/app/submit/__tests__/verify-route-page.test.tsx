import { render } from '@/test/test-utils'

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

describe('SubmitVerifyPage', () => {
  beforeEach(() => {
    mockNotFound.mockClear()
  })

  it('does not expose the old runtime badge verification page', async () => {
    const { default: SubmitVerifyPage } = await import('@/app/submit/verify/page')

    render(<SubmitVerifyPage />)

    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })
})
