import { SubmitPageSurface } from '@thedaviddias/web-core/forms/submit-page-surface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Yours',
  description: 'Submit your downloader software product to SERP Software.'
}

export default function SubmitPage() {
  return <SubmitPageSurface />
}
