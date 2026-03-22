import Link from 'next/link'
import { getCategories, getTools } from '@/lib/data'
import { getCategoryRoute, routes } from '@/lib/routes'
import { getCategoryMeta } from '@/lib/site'

interface AppSidebarProps {
  currentCategory?: string
  featuredCount?: number
}

export function AppSidebar({ currentCategory, featuredCount = 0 }: AppSidebarProps) {
  const categories = getCategories()
  const tools = getTools()

  return (
    <aside className="sticky top-16 hidden h-screen w-60 min-w-60 overflow-hidden border-r border-border/50 sm:block">
      <div className="space-y-6 p-4">
        <div>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Categories</h2>
          <nav className="space-y-1">
            <Link
              href={`${routes.home}#all-websites`}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                currentCategory ? 'text-muted-foreground hover:bg-muted/50 hover:text-foreground' : 'bg-accent font-medium text-foreground'
              }`}
            >
              <span className="size-2 rounded-full bg-foreground" />
              All Websites
            </Link>
            <Link
              href={routes.featured}
              className="flex items-center justify-between rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-foreground" />
                Featured
              </span>
              {featuredCount ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{featuredCount}</span> : null}
            </Link>
            {categories.map(category => {
              const meta = getCategoryMeta(category.slug)
              const Icon = meta.icon
              const isActive = currentCategory === category.slug

              return (
                <Link
                  key={category.slug}
                  href={getCategoryRoute(category.slug)}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                    isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {category.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Tools</h2>
          <nav className="space-y-1">
            {tools.map(tool => (
              <Link
                key={tool.slug}
                href={tool.href}
                className="block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <span className="block truncate font-medium">{tool.name}</span>
                <span className="block text-xs text-muted-foreground">{tool.meta}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}