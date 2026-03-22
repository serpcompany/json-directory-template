import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getSiteStats } from '@/lib/data'
import { routes } from '@/lib/routes'

export function HeroSection() {
  const stats = getSiteStats()

  return (
    <section className="relative overflow-hidden py-12 md:py-16 lg:py-20">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-4 text-center md:py-8">
        <div className="fade-up stagger-1">
          <Link
            href={routes.home}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/50 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:border-foreground/20 hover:bg-background/80 md:gap-3 md:text-sm"
          >
          <span className="rounded-full bg-foreground px-2.5 py-0.5 font-mono text-xs text-background">
            {stats.websiteCount}
          </span>
          <span className="text-muted-foreground">Websites in directory</span>
          </Link>
        </div>

        <h1 className="fade-up stagger-2 mt-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl xl:text-7xl">
          <span className="bg-linear-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
            llms.txt Hub
          </span>
        </h1>

        <p className="fade-up stagger-3 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
          The largest directory for <span className="font-medium text-foreground">AI-ready documentation</span> and tools implementing the proposed llms.txt standard.
        </p>

        <div className="fade-up stagger-4 mt-8 flex flex-col justify-center gap-3 pt-2 sm:flex-row md:gap-4">
          <Link
            href="#all-websites"
            className="group inline-flex items-center justify-center gap-2 rounded-none bg-foreground px-6 py-3 text-sm font-bold text-background transition-all duration-300 hover:bg-foreground/90 hover:gap-3 md:px-8 md:py-4 md:text-base"
          >
            Browse websites
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={routes.guides}
            className="inline-flex items-center justify-center rounded-none border-2 border-foreground/20 px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-foreground/40 hover:bg-foreground/5 md:px-8 md:py-4 md:text-base"
          >
            Learn more
          </Link>
        </div>
      </div>
    </section>
  )
}