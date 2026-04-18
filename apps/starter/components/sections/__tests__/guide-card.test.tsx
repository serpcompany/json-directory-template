import { render, screen } from '@/test/test-utils'
import { GuideCardRoute as GuideCard } from '@thedaviddias/web-core/sections/guide-card-route'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />
}))

describe('GuideCard', () => {
  it('renders guide content through the package-owned wrapper', () => {
    render(
      <GuideCard
        guide={{
          authors: [],
          category: 'getting-started',
          date: '2026-04-18',
          description: 'How to use the directory',
          difficulty: 'beginner',
          published: true,
          slug: 'starter-guide',
          title: 'Starter Guide',
        }}
      />
    )

    expect(screen.getByText('beginner')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Starter Guide' })).toHaveAttribute(
      'href',
      '/posts/starter-guide'
    )
    expect(screen.getByText('How to use the directory')).toBeInTheDocument()
  })
})
