import { SubmitPageSurface } from '@thedaviddias/web-core/forms/submit-page-surface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Yours',
  description: 'Submit your browser extension or add-on to BrowserExtensions.io.'
}

export default function SubmitPage() {
  return <SubmitPageSurface />
}
