import { Button } from '@thedaviddias/design-system/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export type SectionProps = {
  title: string
  description?: string
  children: ReactNode
  viewAllHref?: string
  viewAllText?: string
  titleId?: string
}

export function Section({
  children,
  title,
  description,
  viewAllHref,
  viewAllText = 'View all',
  titleId
}: SectionProps) {
  return (
    <section className="space-y-6" aria-labelledby={titleId ?? undefined}>
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 flex items-center justify-between py-3 sm:py-4 -mx-6 px-6">
        <div className="space-y-0.5 sm:space-y-1 flex-1">
          <h2
            id={titleId}
            className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight scroll-mt-20"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-foreground"
              aria-hidden="true"
            />
            {title}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 pl-3.5">
              {description}
            </p>
          )}
        </div>
        {viewAllHref && (
          <div className="flex items-center gap-2 ml-2">
            <Button
              asChild
              variant="ghost"
              className="group h-auto gap-0 rounded px-0 py-0 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground active:scale-100 has-[>svg]:px-0 sm:text-base"
            >
              <Link href={viewAllHref} aria-label={viewAllText}>
                <span className="hidden sm:inline">{viewAllText}</span>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5 sm:ml-2 sm:size-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
      {children}
    </section>
  )
}
