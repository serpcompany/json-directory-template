import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact SERP AI',
  description: 'Get in touch with the SERP AI team.',
};

export default function ContactPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Contact SERP AI</h1>
        <p className="text-lg text-muted-foreground">
          Contact SERP AI about downloader listings, sponsorships, and directory support.
        </p>
        <a className="font-medium text-primary" href="mailto:hello@serp.ai">
          hello@serp.ai
        </a>
      </div>
    </main>
  );
}
