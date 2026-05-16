import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SERP AI Posts',
  description: 'Updates and resources from SERP AI.',
};

export default function PostsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Posts</h1>
        <p className="text-lg text-muted-foreground">
          Updates, resources, and notes from SERP AI.
        </p>
      </div>
    </main>
  );
}
