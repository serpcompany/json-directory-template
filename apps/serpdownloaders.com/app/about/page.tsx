import { Button } from '@thedaviddias/design-system/button'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAboutPage } from '@/lib/content-loader'
import {
  AboutStaticPage,
  generateAboutPageMetadata,
} from '@thedaviddias/web-core/static-pages/about-page'
import { Card, CardContent, CardHeader, CardTitle } from '@thedaviddias/web-core/ui/card'

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
