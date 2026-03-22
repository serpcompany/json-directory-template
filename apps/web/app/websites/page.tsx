import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SITE_NAME, SITE_PUBLIC_URL } from '@/lib/seo/seo-config'

export function generateMetadata(): Metadata {
  return {
    title: `Websites - ${SITE_NAME}`,
    description: 'Discover a curated list of websites that implement the llms.txt standard.',
    alternates: {
      canonical: `${SITE_PUBLIC_URL}/`
    }
  }
}

export default function ProjectsPage() {
  // Redirect to homepage where all websites are now displayed
  redirect('/')
}
