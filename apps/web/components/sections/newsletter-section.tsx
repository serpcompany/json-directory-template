import Link from 'next/link'
import { getRoute } from '@/lib/routes'
import { siteCopy } from '@/lib/site-copy'

export function NewsletterSection() {
  return (
    <section className="border border-border/50 bg-muted/30 py-8 sm:py-10 rounded-2xl">
      <div className="mx-auto max-w-2xl px-6 text-center space-y-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Keep The Directory Growing
        </p>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Know a site that should be listed?
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Submit it through GitHub and keep the directory fully reviewable, low-cost, and
            static-friendly.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={getRoute('submit')}
            className="inline-flex items-center justify-center rounded-none bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-colors hover:bg-foreground/90"
          >
            {siteCopy.submitLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
