import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@thedaviddias/design-system/pagination'
import { getCategoryPageRoute } from '../category-pagination'

/** Page numbers to show: all when there are few, else first, last, and the current neighbourhood. */
export function getVisibleCategoryPages(page: number, pageCount: number): Array<number | 'gap'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  const sortedPages = [...pages].filter(value => value >= 1 && value <= pageCount).sort((a, b) => a - b)

  return sortedPages.flatMap((value, index) =>
    index > 0 && value - (sortedPages[index - 1] ?? value) > 1 ? ['gap' as const, value] : [value]
  )
}

export function CategoryPaginationNav({
  categorySlug,
  page,
  pageCount
}: {
  categorySlug: string
  page: number
  pageCount: number
}) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <Pagination aria-label="Category pages" className="py-4">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={getCategoryPageRoute(categorySlug, page - 1)} rel="prev" />
          </PaginationItem>
        )}
        {getVisibleCategoryPages(page, pageCount).map((value, index) =>
          value === 'gap' ? (
            <PaginationItem key={`gap-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={value}>
              <PaginationLink href={getCategoryPageRoute(categorySlug, value)} isActive={value === page}>
                {value}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        {page < pageCount && (
          <PaginationItem>
            <PaginationNext href={getCategoryPageRoute(categorySlug, page + 1)} rel="next" />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}
