import { renderToStaticMarkup } from 'react-dom/server.node'
import { rootLayoutMetadata, RootAppShell } from '@thedaviddias/web-core/root-shell'
import { siteConfig } from '@thedaviddias/web-core/site-config'

jest.mock('@thedaviddias/design-system/theme-provider', () => ({
  DesignSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="design-system-provider">{children}</div>
  ),
}))

jest.mock('@thedaviddias/web-core/root-shell-client', () => ({
  AnalyticsTracker: () => <div data-testid="analytics-tracker" />,
  BackToTop: () => <button type="button">Back to top</button>,
  FavoritesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="favorites-provider">{children}</div>
  ),
  GoogleTagManagerNoScript: ({ gtmId }: { gtmId?: string }) => (
    <div data-testid="gtm-noscript">{gtmId}</div>
  ),
  GoogleTagManagerScript: ({ gtmId }: { gtmId?: string }) => (
    <script data-testid="gtm-script" data-gtm-id={gtmId ?? ''} />
  ),
}))

describe('RootAppShell', () => {
  it('exports shared root layout metadata for wrapper apps', () => {
    expect(rootLayoutMetadata.title).toEqual({
      default: `${siteConfig.name} - ${siteConfig.tagline}`,
      template: `%s | ${siteConfig.name}`,
    })
    expect(rootLayoutMetadata.description).toBe(siteConfig.description)
    expect(rootLayoutMetadata.icons).toEqual({
      apple: `${siteConfig.publicUrl}/apple-touch-icon.png`,
      icon: `${siteConfig.publicUrl}/favicon.ico`,
    })
  })

  it('renders the shared root shell around wrapper-provided header, footer, and content', () => {
    const markup = renderToStaticMarkup(
      <RootAppShell
        feedTitle="SERP Downloaders - New Products"
        footer={<footer>Footer slot</footer>}
        gtmId="GTM-TEST"
        header={<header>Header slot</header>}
      >
        <div>Page content</div>
      </RootAppShell>
    )

    expect(markup).toContain('data-testid="gtm-script"')
    expect(markup).toContain('data-gtm-id="GTM-TEST"')
    expect(markup).toContain('data-testid="gtm-noscript"')
    expect(markup).toContain('data-testid="design-system-provider"')
    expect(markup).toContain('data-testid="favorites-provider"')
    expect(markup).toContain('data-testid="analytics-tracker"')
    expect(markup).toContain('Header slot')
    expect(markup).toContain('Page content')
    expect(markup).toContain('Footer slot')
    expect(markup).toContain('Back to top')
    expect(markup).toContain('title="SERP Downloaders - New Products"')
    expect(markup).toContain('href="/rss.xml"')
  })
})
