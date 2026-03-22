import { ArrowUpRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Website } from '@/lib/types'
import { getWebsiteRoute } from '@/lib/routes'
import { getCategoryMeta } from '@/lib/site'

interface WebsiteCardProps {
  website: Website
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const categoryMeta = getCategoryMeta(website.category)
  const Icon = categoryMeta.icon
  const domain = website.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

  return (
    <Link
      href={getWebsiteRoute(website.slug)}
      className="group block rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <img alt={`${website.name} favicon`} className="mt-0.5 size-11 rounded-xl border border-border/50 bg-background p-2" src={favicon} />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight">{website.name}</h3>
              {website.featured ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="size-3" />
                  Featured
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{website.tagline}</p>
          </div>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">{website.description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {categoryMeta.label}
        </span>
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {website.installCount} installs
        </span>
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {website.pricing}
        </span>
      </div>
    </Link>
  )
}