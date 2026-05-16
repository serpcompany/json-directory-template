import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit to SERP AI',
  description: 'Submit your AI product, company, model, dataset, or resource to SERP AI.',
};

export default function SubmitPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Submit to SERP AI</h1>
        <p className="text-lg text-muted-foreground">
          Share a downloader product or browser tool for review by the SERP AI team.
        </p>
        <a className="font-medium text-primary" href="mailto:hello@serp.ai">
          hello@serp.ai
        </a>
      </div>
    </main>
  );
}
