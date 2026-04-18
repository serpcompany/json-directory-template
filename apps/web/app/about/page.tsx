import { Button } from '@thedaviddias/design-system/button'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAboutPage } from '@/lib/content-loader'
import {
  AboutStaticPage,
  generateAboutPageMetadata
} from '@thedaviddias/web-core/static-pages/about-page'

export async function generateMetadata(): Promise<Metadata> {
  return generateAboutPageMetadata(await getAboutPage())
}

export default async function AboutPage() {
  const aboutPage = await getAboutPage()

  if (!aboutPage) {
    notFound()
  }

  return (
    <AboutStaticPage
      aboutPage={aboutPage}
      slots={{ Button, Card, CardContent, CardHeader, CardTitle }}
    />
  )
}
