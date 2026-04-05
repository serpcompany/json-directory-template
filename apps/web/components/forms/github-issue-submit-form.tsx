'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildSubmissionIssueUrl } from '@/lib/github-issue';
import { getCategoryDisplayName } from '@/lib/category-display';
import { categories } from '@/lib/categories';
import { siteCopy } from '@/lib/site-copy';
import { hasConfiguredGitHubIssueTarget, siteConfig } from '@/lib/site-config';
import { SubmitFormGuidelines } from './submit-form-guidelines';

interface SubmissionFormState {
  category: string;
  description: string;
  name: string;
  notes: string;
  website: string;
}

const INITIAL_FORM_STATE: SubmissionFormState = {
  category: '',
  description: '',
  name: '',
  notes: '',
  website: '',
};

export function GitHubIssueSubmitForm() {
  const router = useRouter();
  const [formState, setFormState] =
    useState<SubmissionFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const listingLabel = siteCopy.listingName.singularTitle;
  const hasConfiguredIssueTarget = hasConfiguredGitHubIssueTarget(siteConfig);

  function updateField<Key extends keyof SubmissionFormState>(
    key: Key,
    value: SubmissionFormState[Key]
  ): void {
    setFormState((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          website: formState.website,
          category: formState.category,
          description: formState.description,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: unknown };
        setSubmitError('Submission failed. Please check your input and try again.');
        console.error('Submit error:', data.error);
        return;
      }

      const data = await res.json() as { token: string };
      router.push('/submit/verify?token=' + data.token);
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const githubIssueUrl = buildSubmissionIssueUrl({
    category: formState.category,
    description: formState.description,
    name: formState.name,
    notes: formState.notes,
    website: formState.website,
  });

  const isSubmitDisabled =
    isSubmitting || !formState.name || !formState.website || !formState.category;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{siteCopy.submitLabel}</h1>
        <p className="text-muted-foreground">
          Share the basics and we&apos;ll review your submission. No account is required.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
        Fill out the form below. You&apos;ll receive a token to track your submission status.
      </div>

      {!hasConfiguredIssueTarget ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Configure the GitHub issue target in <code>sites/site-config.default.ts</code> before
          enabling starter submissions.
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {submitError}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Name</span>
            <input
              required
              type="text"
              value={formState.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={`Example ${listingLabel}`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              required
              value={formState.category}
              onChange={(event) => updateField('category', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {getCategoryDisplayName(category.slug)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Choose the best primary category. Reviewers can add secondary
              categories later if needed.
            </p>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">{listingLabel} URL</span>
            <input
              required
              type="url"
              value={formState.website}
              onChange={(event) => updateField('website', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://example.com"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={formState.description}
            onChange={(event) => updateField('description', event.target.value)}
            className="min-h-32 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder={`A short summary of what this ${siteCopy.listingName.singular} covers and why it is useful.`}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Additional notes</span>
          <textarea
            value={formState.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            className="min-h-24 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Optional context for reviewers."
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center rounded-none bg-foreground px-6 py-3 text-sm font-bold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => setFormState(INITIAL_FORM_STATE)}
            className="inline-flex items-center justify-center rounded-none border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-muted/50"
          >
            Reset
          </button>
          <a
            href={githubIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-none border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-muted/50"
          >
            Or submit via GitHub →
          </a>
        </div>
      </form>

      <SubmitFormGuidelines />
    </div>
  );
}
