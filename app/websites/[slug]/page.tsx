import type { Metadata } from 'next'
import { ExternalLink, Globe } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCategoryBySlug,
  getDocumentationLinks,
  getRelatedWebsites,
  getWebsiteBySlug,
  getWebsiteFavicon,
  getWebsiteNeighbors,
  getWebsiteSlugs
} from '@/lib/data'
import { getWebsiteRoute, routes } from '@/lib/routes'
import { getCategoryMeta } from '@/lib/site'

interface WebsitePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getWebsiteSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: WebsitePageProps): Promise<Metadata> {
  const { slug } = await params
  const website = getWebsiteBySlug(slug)

  if (!website) {
    return {
      title: 'Website Not Found'
    }
  }

  return {
    title: website.name,
    description: website.description
  }
}

export default async function WebsitePage({ params }: WebsitePageProps) {
  const { slug } = await params
  const website = getWebsiteBySlug(slug)

  if (!website) {
    notFound()
  }

  const docs = getDocumentationLinks(website.website)
  const category = getCategoryBySlug(website.category)
  const categoryMeta = getCategoryMeta(website.category)
  const favicon = getWebsiteFavicon(website.website)
  const relatedWebsites = getRelatedWebsites(website)
  const neighbors = getWebsiteNeighbors(website.slug)

  return (
    <div className="min-h-screen border-t border-border/70">
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-muted/30 via-background to-background">
        <div className="grid-noise absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-8 md:py-12">
          <div className="mb-8 text-sm text-muted-foreground">
            <Link href={routes.websites} className="hover:text-foreground">
              Websites
            </Link>
            <span className="mx-2">/</span>
            <span>{website.name}</span>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            <div className="shrink-0 rounded-2xl border border-border bg-card p-3 shadow-sm">
              <img alt={`${website.name} favicon`} className="size-18 rounded-xl" src={favicon} />
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{website.name}</h1>
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {categoryMeta.label}
                </span>
              </div>

              <Link
                href={website.website}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Globe className="size-4" />
                {website.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="size-3.5" />
              </Link>

              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{website.description}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            <section className="rounded-2xl border border-border/70 bg-card p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Install command
                    </p>
                    <div className="mt-3 rounded-2xl bg-muted p-4 font-mono text-sm">
                      npx llmstxt-cli install {website.slug}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    llms.txt files
                  </p>
                  <div className="space-y-3">
                    <Link href={docs.llms} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:bg-muted">
                      <span>View llms.txt</span>
                      <ExternalLink className="size-4" />
                    </Link>
                    <Link href={docs.llmsFull} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:bg-muted">
                      <span>View llms-full.txt</span>
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              {website.sections.map(section => (
                <article key={section.title} className="rounded-2xl border border-border/70 bg-card p-6 md:p-8">
                  <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                  <div className="prose-copy mt-4 space-y-4">
                    {section.content.map(paragraph => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-6 md:p-8">
              <h2 className="text-xl font-bold tracking-tight">Highlights</h2>
              <ul className="prose-copy mt-4">
                {website.highlights.map(highlight => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Total installs
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{website.installCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Category
                  </p>
                  <Link href={`/${website.category}/`} className="mt-2 inline-block text-sm font-medium hover:underline">
                    {category?.name ?? categoryMeta.label}
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Added
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">{website.addedDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Pricing
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">{website.pricing}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">{website.status}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Stack
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {website.stack.map(item => (
                      <span key={item} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 space-y-10">
          {(neighbors.previousWebsite || neighbors.nextWebsite) ? (
            <section className="rounded-2xl border border-border/70 bg-card p-6 md:p-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Browse more
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {neighbors.previousWebsite ? (
                  <Link href={getWebsiteRoute(neighbors.previousWebsite.slug)} className="rounded-2xl border border-border bg-background p-5 transition-colors hover:bg-muted">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Previous</div>
                    <div className="mt-2 text-lg font-semibold tracking-tight">{neighbors.previousWebsite.name}</div>
                  </Link>
                ) : <div />}
                {neighbors.nextWebsite ? (
                  <Link href={getWebsiteRoute(neighbors.nextWebsite.slug)} className="rounded-2xl border border-border bg-background p-5 text-right transition-colors hover:bg-muted">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Next</div>
                    <div className="mt-2 text-lg font-semibold tracking-tight">{neighbors.nextWebsite.name}</div>
                  </Link>
                ) : <div />}
              </div>
            </section>
          ) : null}

          {relatedWebsites.length ? (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Related websites</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {relatedWebsites.map(item => (
                  <Link
                    key={item.slug}
                    href={getWebsiteRoute(item.slug)}
                    className="rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:bg-background"
                  >
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight">{item.name}</h3>
                      <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}