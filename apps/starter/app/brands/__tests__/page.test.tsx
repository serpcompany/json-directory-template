import { render, screen } from '@/test/test-utils'

jest.mock('@thedaviddias/web-core/static-pages/brands-page', () => ({
  __esModule: true,
  default: () => <main>Shared brands page</main>,
  dynamic: 'force-static',
  generateMetadata: jest.fn(() => ({ title: 'Brands' }))
}))

describe('Brands route wrapper', () => {
  it('re-exports the shared brands page without local route behavior', async () => {
    const brandsPageModule = await import('../page')

    expect(brandsPageModule.dynamic).toBe('force-static')
    expect(brandsPageModule.generateMetadata()).toEqual({ title: 'Brands' })

    render(<brandsPageModule.default />)

    expect(screen.getByText('Shared brands page')).toBeInTheDocument()
  })
})
