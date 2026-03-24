import type { Metadata } from 'next'
import { SITE_NAME, generateBaseMetadata } from '@/lib/seo/seo-config'

export const metadata: Metadata = generateBaseMetadata({
  title: 'Submit a Website',
  description:
    `Submit a website or tool to be included in ${SITE_NAME}.`,
  path: '/submit',
  keywords: ['submit website', 'submit tool', 'contribute', 'directory submission'],
  noindex: true // Don't index submission page to prevent spam
})

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children
}
