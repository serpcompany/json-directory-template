import type { Metadata } from 'next'
import Link from 'next/link'
import { getRoute } from '@thedaviddias/web-core/routes'
import { generateBaseMetadata } from '@thedaviddias/web-core/seo-config'

export const metadata: Metadata = generateBaseMetadata({
  title: 'About BrowserExtensions.io',
  description:
    'BrowserExtensions.io is a curated directory that helps people discover useful browser extensions and downloader tools.',
  path: getRoute('about'),
  keywords: [
    'BrowserExtensions.io',
    'browser extensions directory',
    'browser extension discovery',
    'extension submissions',
  ],
})

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <div className="space-y-10">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            About BrowserExtensions.io
          </h1>
          <p className="text-xl text-muted-foreground">
            BrowserExtensions.io is a curated directory that helps people
            discover great products quickly, and helps builders get discovered
            by the right audience.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">What We Do</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Curate high-quality listings so the directory stays useful.</li>
            <li>Make it easy to browse by category and search.</li>
            <li>Provide a straightforward submission flow for creators.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How To Get Listed</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Submit your listing.</li>
            <li>We review it for quality and fit.</li>
            <li>Once approved, it goes live in the directory.</li>
          </ol>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-10 items-center justify-center bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90"
            href={getRoute('submit')}
          >
            Submit Your Browser Extension
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center border border-border px-4 text-sm font-semibold hover:bg-muted"
            href={getRoute('listing.list')}
          >
            Browse Products
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Questions, corrections, and partnership notes can be sent to{' '}
            <a className="text-primary hover:underline" href="mailto:marketing@serp.co">
              marketing@serp.co
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
