import registryData from '@cli-data/registry.json';
import { Calendar, Download, Hash } from 'lucide-react';
import Link from 'next/link';
import { getCategoryDisplayName } from '@thedaviddias/web-core/category-display';
import type { WebsiteMetadata } from '@/lib/content-loader';
import { getRoute } from '@thedaviddias/web-core/routes';

const webSlugToCliSlug = new Map<string, string>();
for (const entry of registryData as { slug: string; webSlug?: string }[]) {
  if (entry.webSlug) {
    webSlugToCliSlug.set(entry.webSlug, entry.slug);
  }
}

interface WebsiteDetailSidebarProps {
  website: WebsiteMetadata;
}

/**
 * Sidebar for website detail pages showing static metadata for the selected website.
 */
export function WebsiteDetailSidebar({ website }: WebsiteDetailSidebarProps) {
  const cliSlug = webSlugToCliSlug.get(website.slug);
  const categorySlugs = [
    ...(website.category ? [website.category] : []),
    ...(website.categories || []),
  ].filter(
    (value, index, values) => Boolean(value) && values.indexOf(value) === index
  );

  return (
    <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-6">
        {cliSlug && (
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Download className="size-3" aria-hidden />
              CLI Slug
            </span>
            <p className="mt-1 text-sm font-mono text-foreground">{cliSlug}</p>
          </div>
        )}

        {categorySlugs.length > 0 && (
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="size-3" aria-hidden />
              {categorySlugs.length > 1 ? 'Categories' : 'Category'}
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {categorySlugs.map((categorySlug) => (
                <Link
                  key={categorySlug}
                  href={getRoute('category.page', { category: categorySlug })}
                  className="inline-block text-sm text-foreground hover:text-primary transition-colors capitalize"
                >
                  {getCategoryDisplayName(categorySlug)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {website.publishedAt && (
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3" aria-hidden />
              Added
            </span>
            <p className="text-sm text-foreground mt-1">
              {new Date(website.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
