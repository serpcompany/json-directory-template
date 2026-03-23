import { getLegalContent } from '@/lib/content-loader'
import { siteConfig } from '@/lib/site-config'

describe('legal content', () => {
  it('renders privacy content with current site branding and no template placeholders', async () => {
    const privacyContent = await getLegalContent('privacy')

    expect(privacyContent).toContain(siteConfig.name)
    expect(privacyContent).toContain(siteConfig.domain)
    expect(privacyContent).not.toContain('{{siteName}}')
    expect(privacyContent).not.toContain('{{domain}}')
    expect(privacyContent).not.toMatch(/llmstxthub/i)
  })

  it('renders terms content with current site branding and no template placeholders', async () => {
    const termsContent = await getLegalContent('terms')

    expect(termsContent).toContain(siteConfig.name)
    expect(termsContent).toContain(siteConfig.domain)
    expect(termsContent).not.toContain('{{siteName}}')
    expect(termsContent).not.toContain('{{domain}}')
    expect(termsContent).not.toMatch(/llmstxthub/i)
  })
})
