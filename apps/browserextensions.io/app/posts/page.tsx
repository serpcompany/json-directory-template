import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BrowserExtensions.io Posts',
  description: 'Posts and updates from BrowserExtensions.io.',
}

export default function PostsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Posts</h1>
        <p className="text-lg text-muted-foreground">
          Posts and updates will appear here when published.
        </p>
      </div>
    </main>
  )
}
