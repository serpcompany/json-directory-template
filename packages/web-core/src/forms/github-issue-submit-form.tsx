'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { categories } from '../categories'
import { getCategoryDisplayName } from '../category-display'
import { buildSubmissionIssueUrl } from '../github-issue'
import { hasConfiguredGitHubIssueTarget, siteConfig } from '../site-config'
import { siteCopy } from '../site-copy'
import { SubmitFormGuidelines } from './submit-form-guidelines'

interface ResourceLink {
  label: string
  url: string
}

interface FaqEntry {
  answer: string
  question: string
}

interface SubmissionFormState {
  category: string
  content: string
  description: string
  faqs: FaqEntry[]
  logoUrl: string
  name: string
  resourceLinks: ResourceLink[]
  videoUrl: string
  website: string
}

const INITIAL_FORM_STATE: SubmissionFormState = {
  category: '',
  content: '',
  description: '',
  faqs: [{ answer: '', question: '' }],
  logoUrl: '',
  name: '',
  resourceLinks: [{ label: '', url: '' }],
  videoUrl: '',
  website: ''
}

type GitHubIssueSubmitFormProps = {
  submitEndpoint: string
}

export function GitHubIssueSubmitForm({ submitEndpoint }: GitHubIssueSubmitFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<SubmissionFormState>(INITIAL_FORM_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const listingLabel = siteCopy.listingName.singularTitle
  const hasConfiguredIssueTarget = hasConfiguredGitHubIssueTarget(siteConfig)

  function updateField<Key extends keyof Omit<SubmissionFormState, 'faqs' | 'resourceLinks'>>(
    key: Key,
    value: SubmissionFormState[Key]
  ): void {
    setFormState(currentState => ({
      ...currentState,
      [key]: value
    }))
  }

  function updateResourceLink(index: number, field: keyof ResourceLink, value: string): void {
    setFormState(currentState => {
      const updated = currentState.resourceLinks.map((link, currentIndex) =>
        currentIndex === index ? { ...link, [field]: value } : link
      )

      return { ...currentState, resourceLinks: updated }
    })
  }

  function addResourceLink(): void {
    setFormState(currentState => ({
      ...currentState,
      resourceLinks: [...currentState.resourceLinks, { label: '', url: '' }]
    }))
  }

  function removeResourceLink(index: number): void {
    setFormState(currentState => ({
      ...currentState,
      resourceLinks: currentState.resourceLinks.filter(
        (_link, currentIndex) => currentIndex !== index
      )
    }))
  }

  function updateFaq(index: number, field: keyof FaqEntry, value: string): void {
    setFormState(currentState => {
      const updated = currentState.faqs.map((faq, currentIndex) =>
        currentIndex === index ? { ...faq, [field]: value } : faq
      )

      return { ...currentState, faqs: updated }
    })
  }

  function addFaq(): void {
    setFormState(currentState => ({
      ...currentState,
      faqs: [...currentState.faqs, { answer: '', question: '' }]
    }))
  }

  function removeFaq(index: number): void {
    setFormState(currentState => ({
      ...currentState,
      faqs: currentState.faqs.filter((_faq, currentIndex) => currentIndex !== index)
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    const faqs = formState.faqs
      .filter(faq => faq.question.trim() && faq.answer.trim())
      .map(faq => ({
        answer: faq.answer.trim(),
        question: faq.question.trim()
      }))
    const resourceLinks = formState.resourceLinks
      .filter(link => link.label.trim() && link.url.trim())
      .map(link => ({
        label: link.label.trim(),
        url: link.url.trim()
      }))

    try {
      const response = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formState.category,
          content: formState.content,
          description: formState.description,
          faqs,
          logoUrl: formState.logoUrl,
          name: formState.name,
          resourceLinks,
          videoUrl: formState.videoUrl,
          website: formState.website
        })
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: unknown }
        setSubmitError('Submission failed. Please check your input and try again.')
        console.error('Submit error:', data.error)
        return
      }

      const data = (await response.json()) as { token: string }
      router.push(`/submit/verify?token=${data.token}`)
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const githubIssueUrl = hasConfiguredIssueTarget
    ? buildSubmissionIssueUrl({
        category: formState.category,
        description: formState.description,
        logoUrl: formState.logoUrl,
        name: formState.name,
        notes: formState.content,
        videoUrl: formState.videoUrl,
        website: formState.website
      })
    : null

  const hasPartiallyFilledFaq = formState.faqs.some(
    faq => Boolean(faq.question.trim()) !== Boolean(faq.answer.trim())
  )
  const isSubmitDisabled =
    isSubmitting ||
    !formState.name.trim() ||
    !formState.website.trim() ||
    !formState.category.trim() ||
    !formState.logoUrl.trim() ||
    !formState.description.trim() ||
    !formState.content.trim() ||
    hasPartiallyFilledFaq

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
          GitHub fallback submission is disabled until you configure the issue target in{' '}
          <code>sites/site-config.default.ts</code>.
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {submitError}
        </div>
      ) : null}

      <form className="space-y-6" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel required>Name</FieldLabel>
            <input
              required
              type="text"
              value={formState.name}
              onChange={event => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={`Example ${listingLabel}`}
            />
          </label>

          <label className="space-y-2">
            <FieldLabel required>Category</FieldLabel>
            <select
              required
              value={formState.category}
              onChange={event => updateField('category', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a category</option>
              {categories.map(category => (
                <option key={category.slug} value={category.slug}>
                  {getCategoryDisplayName(category.slug)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Choose the best primary category. Reviewers can add secondary categories later if
              needed.
            </p>
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel required>Website URL</FieldLabel>
            <input
              required
              type="url"
              value={formState.website}
              onChange={event => updateField('website', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://example.com"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel required>Logo URL</FieldLabel>
            <input
              required
              type="url"
              value={formState.logoUrl}
              onChange={event => updateField('logoUrl', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://example.com/logo.png"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Video URL</FieldLabel>
            <input
              type="url"
              value={formState.videoUrl}
              onChange={event => updateField('videoUrl', event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>
        </div>

        <label className="block space-y-2">
          <FieldLabel required>Short Description</FieldLabel>
          <textarea
            required
            value={formState.description}
            onChange={event => updateField('description', event.target.value)}
            className="min-h-24 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="One sentence describing what this listing covers."
          />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>Full Description</FieldLabel>
          <textarea
            required
            value={formState.content}
            onChange={event => updateField('content', event.target.value)}
            className="min-h-48 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Markdown supported. Describe what makes this listing valuable."
          />
        </label>

        <div className="space-y-3">
          <FieldLabel>FAQs</FieldLabel>
          {formState.faqs.map((faq, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2fr_auto]">
              <label className="space-y-1">
                <span className="sr-only">FAQ question</span>
                <input
                  type="text"
                  value={faq.question}
                  onChange={event => updateFaq(index, 'question', event.target.value)}
                  aria-invalid={Boolean(faq.question.trim()) !== Boolean(faq.answer.trim())}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Question"
                />
              </label>
              <label className="space-y-1">
                <span className="sr-only">FAQ answer</span>
                <input
                  type="text"
                  value={faq.answer}
                  onChange={event => updateFaq(index, 'answer', event.target.value)}
                  aria-invalid={Boolean(faq.question.trim()) !== Boolean(faq.answer.trim())}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Answer"
                />
              </label>
              <button
                type="button"
                disabled={formState.faqs.length === 1}
                onClick={() => removeFaq(index)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove FAQ"
              >
                ×
              </button>
            </div>
          ))}
          {formState.faqs.length < 5 ? (
            <button
              type="button"
              onClick={addFaq}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Add another FAQ
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          <FieldLabel>Resource Links</FieldLabel>
          <p className="text-xs text-muted-foreground">
            Optional links to docs, demos, or related resources (max 5).
          </p>
          {formState.resourceLinks.map((link, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2fr_auto]">
              <label className="space-y-1">
                <span className="sr-only">Resource link label</span>
                <input
                  type="text"
                  value={link.label}
                  onChange={event => updateResourceLink(index, 'label', event.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Label"
                />
              </label>
              <label className="space-y-1">
                <span className="sr-only">Resource link URL</span>
                <input
                  type="url"
                  value={link.url}
                  onChange={event => updateResourceLink(index, 'url', event.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="https://example.com/docs"
                />
              </label>
              <button
                type="button"
                disabled={formState.resourceLinks.length === 1}
                onClick={() => removeResourceLink(index)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove link"
              >
                ×
              </button>
            </div>
          ))}
          {formState.resourceLinks.length < 5 ? (
            <button
              type="button"
              onClick={addResourceLink}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Add another link
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center rounded-none bg-foreground px-6 py-3 text-sm font-bold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Listing'}
          </button>
          <button
            type="button"
            onClick={() => setFormState(INITIAL_FORM_STATE)}
            className="inline-flex items-center justify-center rounded-none border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-muted/50"
          >
            Reset
          </button>
          {githubIssueUrl ? (
            <a
              href={githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-none border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-muted/50"
            >
              Or submit via GitHub →
            </a>
          ) : null}
        </div>
      </form>

      <SubmitFormGuidelines />
    </div>
  )
}

function FieldLabel({
  children,
  required = false
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <span className="text-sm font-medium">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  )
}
