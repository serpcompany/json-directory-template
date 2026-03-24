import { Badge } from '@thedaviddias/design-system/badge'
import Link from 'next/link'
import { FaviconWithFallback } from '@/components/ui/favicon-with-fallback'
import { getRoute } from '@/lib/routes'
import { stripHtmlTags } from '@/lib/utils'

interface ProjectListProps {
  items: Array<{
    slug: string
    name: string
    description: string
    website: string
    resourceLinks?: Array<{
      label: string
      url: string
    }>
    category?: string
    isUnofficial?: boolean
  }>
}

/**
 * Displays a list of projects with metadata and action buttons
 * @param props - The component props
 * @returns React component that renders project cards
 */
export function ProjectList({ items = [] }: ProjectListProps) {
  if (!items?.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        if (!item?.slug) return null
        return (
          <div
            key={item.slug}
            className="relative border rounded-lg p-4 hover:bg-muted/50 transition-colors group relative"
          >
            <div className="flex items-start gap-4">
              <FaviconWithFallback
                website={item.website}
                name={item.name}
                size={32}
                className="rounded-sm"
              />
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold group-hover:underline">
                        <Link
                          href={getRoute('listing.detail', { slug: item.slug })}
                          className="z-10 after:absolute after:inset-0 after:content-[''] z-10"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      {item.isUnofficial && (
                        <Badge
                          variant="outline"
                          className="text-xs border-yellow-500/20 bg-yellow-500/10 dark:border-yellow-400/30 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20 dark:hover:bg-yellow-400/20 transition-colors"
                        >
                          Unofficial
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stripHtmlTags(item.description)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {item.resourceLinks?.map(link => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="relative z-20 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      {link.label}
                    </a>
                  ))}
                  {item.category && (
                    <Badge variant="secondary" className="ml-2">
                      {item.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
