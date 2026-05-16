import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact BrowserExtensions.io',
  description: 'Contact BrowserExtensions.io.',
}

export default function ContactPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="text-lg text-muted-foreground">
          Contact BrowserExtensions.io about listings, sponsorships, and directory support.
        </p>
        <a className="font-medium text-primary" href="mailto:marketing@serp.co">
          marketing@serp.co
        </a>
      </div>
    </main>
  )
}
