import { render, screen } from '@/test/test-utils'
import LoginPage from '@/app/login/page'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  getSafeCallbackUrl: (value?: string) => value ?? '/account',
  getSession: jest.fn(async () => null),
  isGitHubAuthConfigured: jest.fn(() => true)
}))

describe('LoginPage', () => {
  it('renders the GitHub auth call to action', async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({})
    })

    render(page)

    expect(screen.getByRole('heading', { level: 1, name: /sign up \/ sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
  })
})
