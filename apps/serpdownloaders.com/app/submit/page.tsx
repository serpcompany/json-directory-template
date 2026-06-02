import { SubmitPageSurface } from '@thedaviddias/web-core/forms/submit-page-surface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Yours',
  description: 'Submit your downloader product or browser tool to SERP Downloaders.'
}

export default function SubmitPage() {
  return <SubmitPageSurface />
}
