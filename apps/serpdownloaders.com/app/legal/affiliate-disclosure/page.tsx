import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb'
import type { Metadata } from 'next'
import { getLegalContent } from '@/lib/content-loader'
import { components } from '@thedaviddias/web-core/mdx-components'
import {
  LegalStaticPage,
  generateLegalPageMetadata,
} from '@thedaviddias/web-core/static-pages/legal-page'

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Affiliate Disclosure',
  description:
    'Affiliate disclosure for {{SITE_NAME}}. Learn how this site handles affiliate relationships and compensation.',
  path: '/legal/affiliate-disclosure',
})

export default async function AffiliateDisclosurePage() {
  const content = await getLegalContent('affiliate-disclosure')

  return (
    <LegalStaticPage
      content={content}
      mdxComponents={components}
      path="/legal/affiliate-disclosure"
      slots={{ Breadcrumb }}
      title="Affiliate Disclosure"
    />
  )
}
