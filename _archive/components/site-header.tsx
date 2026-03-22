import { Github, Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/lib/routes'

const navLinks = [
  { href: routes.projects, label: 'Projects' },
  { href: routes.guides, label: 'Guides' },
  { href: routes.members, label: 'Members' }
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container-shell flex h-16 items-center justify-between gap-3 sm:gap-4 2xl:grid 2xl:grid-cols-3 2xl:justify-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Menu"
            className="-ml-2 inline-flex p-2 text-muted-foreground transition-colors hover:bg-muted sm:hidden"
          >
            <Menu className="size-5" />
          </button>
          <Link href={routes.home} className="group whitespace-nowrap text-lg font-bold tracking-tight">
            <span>llms.txt</span>
            <span className="ml-1 text-muted-foreground transition-colors group-hover:text-foreground">hub</span>
          </Link>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-border/50 bg-background/50 px-4 py-2 backdrop-blur-sm">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Search websites, guides, and projects</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 2xl:justify-end">
          <nav className="hidden items-center gap-4 lg:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={routes.github}
            className="inline-flex h-9 items-center gap-2 rounded-none bg-foreground px-4 text-sm font-bold text-background transition-all duration-200 hover:bg-foreground/90"
          >
            <Github className="size-4" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
