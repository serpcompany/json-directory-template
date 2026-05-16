import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sponsor BrowserExtensions.io',
  description: 'Sponsorship options for reaching the BrowserExtensions.io audience.',
}

export default function SponsorPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Sponsor BrowserExtensions.io</h1>
        <p className="text-lg text-muted-foreground">
          Reach people actively searching for browser extensions and add-ons.
        </p>
        <a className="font-medium text-primary" href="mailto:marketing@serp.co">
          marketing@serp.co
        </a>
      </div>
    </main>
  )
}
