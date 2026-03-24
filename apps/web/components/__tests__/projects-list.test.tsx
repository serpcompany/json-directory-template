import type { ReactNode } from 'react'
import { render, screen } from '@/test/test-utils'
import { ClientProjectsList } from '@/components/projects-list'

jest.mock('@thedaviddias/design-system/error-boundary', () => ({
  ErrorBoundaryCustom: ({ children }: { children: ReactNode }) => <>{children}</>
}), { virtual: true })

jest.mock('@/hooks/use-website-filters', () => ({
  useWebsiteFilters: () => ({
    categoryFilter: 'all',
    setCategoryFilter: jest.fn(),
    setSortBy: jest.fn(),
    sortBy: 'latest'
  })
}))

describe('ClientProjectsList', () => {
  it('uses listing-neutral heading and empty-state copy', () => {
    render(<ClientProjectsList initialWebsites={[]} />)

    expect(screen.getByRole('heading', { name: /all listings/i })).toBeInTheDocument()
    expect(screen.getByText(/no listings found/i)).toBeInTheDocument()
    expect(
      screen.getByText(/there are no listings matching your current filters/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/all llms websites/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/no websites found/i)).not.toBeInTheDocument()
  })
})
