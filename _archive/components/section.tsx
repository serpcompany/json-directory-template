import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SectionProps {
  children: React.ReactNode
  description?: string
  title: string
  titleId?: string
  viewAllHref?: string
  viewAllText?: string
}

export function Section({
  children,
  description,
  title,
  titleId,
  viewAllHref,
  viewAllText = 'View all'
}: SectionProps) {
  return (
    <section aria-labelledby={titleId ?? undefined} className="space-y-6">
      <div className="section-sticky flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
          <h2 id={titleId} className="scroll-mt-20 flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-foreground" />
            {title}
          </h2>
          {description ? (
            <p className="line-clamp-2 pl-3.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
          ) : null}
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="group ml-2 inline-flex shrink-0 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base"
          >
            <span className="hidden sm:inline">{viewAllText}</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5 sm:ml-2 sm:size-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}