import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { components } from '@/components/mdx';
import { getLegalContent } from '@/lib/content-loader';
import { SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config';

interface LegalDocumentPageProps {
  contentKey: string;
  path: string;
  title: string;
}

export async function LegalDocumentPage({
  contentKey,
  path,
  title,
}: LegalDocumentPageProps) {
  const breadcrumbItems = [{ name: title, href: path }];
  const source = await getLegalContent(contentKey);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} baseUrl={SITE_PUBLIC_URL} />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4 border-b pb-8">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {title}
          </h1>
        </div>
        <div className="prose max-w-none dark:prose-invert">
          <MDXRemote
            source={source}
            components={components}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
