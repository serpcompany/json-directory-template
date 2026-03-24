import type { Metadata } from 'next'
import { SITE_NAME, generateBaseMetadata } from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'

export const metadata: Metadata = generateBaseMetadata({
  title: siteCopy.submitLabel,
  description: `Submit a ${siteCopy.listingName.singular} to be included in ${SITE_NAME}.`,
  path: '/submit',
  keywords: ['submit listing', 'submit tool', 'contribute', 'directory submission'],
  noindex: true // Don't index submission page to prevent spam
})

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children
}
