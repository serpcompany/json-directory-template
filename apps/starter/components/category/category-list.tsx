import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCategoryDisplayName } from '@thedaviddias/web-core/category-display';
import { categories } from '@thedaviddias/web-core/categories';
import { getRoute } from '@thedaviddias/web-core/routes';

/**
 * Renders a grid of category cards linking to their respective pages
 */
export function CategoryList() {
  return (
    <>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={getRoute('category.page', { category: category.slug })}
        >
          <Card className="h-full transition-all hover:border-primary hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                {getCategoryDisplayName(category.slug)}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </>
  );
}
