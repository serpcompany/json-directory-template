import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sponsor SERP AI',
  description: 'Sponsorship options for reaching the SERP AI audience.',
};

export default function SponsorPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Sponsor SERP AI</h1>
        <p className="text-lg text-muted-foreground">
          Reach people actively searching for downloader products and browser tools.
        </p>
        <a className="font-medium text-primary" href="mailto:hello@serp.ai">
          hello@serp.ai
        </a>
      </div>
    </main>
  );
}
