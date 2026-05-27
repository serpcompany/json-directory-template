import { SubmitPageSurface } from '@thedaviddias/web-core/forms/submit-page-surface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit to SERP',
  description: 'Submit your software, AI tool, company, resource, or SERP project to SERP.'
}

export default function SubmitPage() {
  return <SubmitPageSurface />
}
