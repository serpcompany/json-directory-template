'use client';

import { useState } from 'react';
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
  const [formState, setFormState] =
    useState<SubmissionFormState>(INITIAL_FORM_STATE);
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const issueUrl = buildSubmissionIssueUrl({
      category: formState.category,
      description: formState.description,
      name: formState.name,
      notes: formState.notes,
      website: formState.website,
    });

    window.location.assign(issueUrl);
  }

  const isSubmitDisabled =
    !hasConfiguredIssueTarget || !formState.name || !formState.website || !formState.category;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{siteCopy.submitLabel}</h1>
        <p className="text-muted-foreground">
          Share the basics and we&apos;ll open a prefilled GitHub issue for
          review. No account is required on this site.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
        Submissions are reviewed through GitHub issues so the site can stay
        simple and easy to host.
      </div>

      {!hasConfiguredIssueTarget ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Configure the GitHub issue target in <code>sites/site-config.default.ts</code> before
          enabling starter submissions.
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
            Continue on GitHub
          </button>
          <button
            type="button"
            onClick={() => setFormState(INITIAL_FORM_STATE)}
            className="inline-flex items-center justify-center rounded-none border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-muted/50"
          >
            Reset
          </button>
        </div>
      </form>

      <SubmitFormGuidelines />
    </div>
  );
}
