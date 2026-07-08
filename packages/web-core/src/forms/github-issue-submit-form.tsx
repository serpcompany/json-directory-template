'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@thedaviddias/design-system/dialog'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { categories, normalizeCategorySlug } from '../categories'
import { getCategoryDisplayName } from '../category-display'
import { buildSubmissionIssueUrl } from '../github-issue'
import { hasConfiguredGitHubIssueTarget, siteConfig } from '../site-config'
import { siteCopy } from '../site-copy'
import { buildFeaturedOnBadgeEmbedHtml } from '../website/featured-on-badge-embed-panel'
import {
  getFeaturedOnBadgeListingUrl,
  getFeaturedOnBadgePreviewPathFromKey,
  getFeaturedOnBadgePublicUrlFromKey
} from '../website/featured-on-badge-url'

interface CategoryOption {
  isCanonical: boolean
  label: string
  slug: string
}

const HTTPS_PREFIX = 'https://'
const MAX_FAQS = 5
const MAX_RESOURCE_LINKS = 5
type BadgeTheme = 'light' | 'dark'

type BadgeSubmissionInstructions = {
  badgeEmbeds: Record<BadgeTheme, string>
  badgePreviewPaths: Record<BadgeTheme, string>
  githubIssueUrl: string
  listingUrl: string
  name: string
  siteName: string
}

function resolveCategoryOptions(): CategoryOption[] {
  const optionsBySlug = new Map<string, CategoryOption>()

  for (const category of categories) {
    const slug = normalizeCategorySlug(category.slug)
    const option = {
      isCanonical: category.slug === slug,
      label: getCategoryDisplayName(slug),
      slug
    }
    const existingOption = optionsBySlug.get(slug)

    if (!existingOption || (!existingOption.isCanonical && option.isCanonical)) {
      optionsBySlug.set(slug, option)
    }
  }

  return Array.from(optionsBySlug.values())
}

const categoryOptions = resolveCategoryOptions()
const validCategorySlugs = new Set(categoryOptions.map(option => option.slug))

function hasCompleteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

function isEmptyUrlField(value: string): boolean {
  const trimmedValue = value.trim()
  return !trimmedValue || trimmedValue === HTTPS_PREFIX
}

function getSubmissionSlug(website: string): string {
  try {
    return new URL(website).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export function buildBadgeSubmissionInstructions({
  githubIssueUrl,
  name,
  website
}: {
  githubIssueUrl: string
  name: string
  website: string
}): BadgeSubmissionInstructions {
  const siteName = siteConfig.badges.featuredOn.displayName
  const slug = getSubmissionSlug(website)
  const listingUrl = getFeaturedOnBadgeListingUrl({
    listingBasePath: siteConfig.listingRouteBasePath,
    listingDetailSuffix: siteConfig.sitemap.listingDetailSuffix,
    publicUrl: siteConfig.publicUrl,
    slug
  })
  const badgeKeys = siteConfig.badges.featuredOn
  const badgeUrls = {
    dark: getFeaturedOnBadgePublicUrlFromKey(badgeKeys.dark, siteConfig.publicUrl),
    light: getFeaturedOnBadgePublicUrlFromKey(badgeKeys.light, siteConfig.publicUrl)
  }

  return {
    badgeEmbeds: {
      dark: buildFeaturedOnBadgeEmbedHtml({
        badgeUrl: badgeUrls.dark,
        listingUrl,
        siteName
      }),
      light: buildFeaturedOnBadgeEmbedHtml({
        badgeUrl: badgeUrls.light,
        listingUrl,
        siteName
      })
    },
    badgePreviewPaths: {
      dark: getFeaturedOnBadgePreviewPathFromKey(badgeKeys.dark),
      light: getFeaturedOnBadgePreviewPathFromKey(badgeKeys.light)
    },
    githubIssueUrl,
    listingUrl,
    name,
    siteName
  }
}

const requiredUrlSchema = z
  .string()
  .trim()
  .refine(value => !isEmptyUrlField(value), {
    message: 'Enter a full URL, including the domain.'
  })
  .refine(hasCompleteHttpUrl, {
    message: 'Enter a valid URL that starts with http:// or https://.'
  })

const optionalUrlSchema = z
  .string()
  .trim()
  .refine(value => isEmptyUrlField(value) || hasCompleteHttpUrl(value), {
    message: 'Enter a valid URL that starts with http:// or https://.'
  })

const optionalResourceLinkSchema = z
  .object({
    label: z.string().trim().max(80, 'Keep link labels under 80 characters.'),
    url: optionalUrlSchema
  })
  .superRefine((link, context) => {
    const hasLabel = Boolean(link.label.trim())
    const hasUrl = !isEmptyUrlField(link.url)

    if (!hasLabel && !hasUrl) {
      return
    }

    if (!hasLabel) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a resource label.',
        path: ['label']
      })
    }

    if (!hasUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a full URL, including the domain.',
        path: ['url']
      })
    }
  })

const optionalFaqSchema = z
  .object({
    answer: z.string().trim().max(1200, 'Keep FAQ answers under 1,200 characters.'),
    question: z.string().trim().max(160, 'Keep FAQ questions under 160 characters.')
  })
  .superRefine((faq, context) => {
    const hasAnswer = Boolean(faq.answer.trim())
    const hasQuestion = Boolean(faq.question.trim())

    if (!hasAnswer && !hasQuestion) {
      return
    }

    if (!hasQuestion) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a question.',
        path: ['question']
      })
    }

    if (!hasAnswer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter an answer.',
        path: ['answer']
      })
    }
  })

const submissionFormSchema = z.object({
  category: z.string().refine(value => validCategorySlugs.has(value), {
    message: 'Choose a category.'
  }),
  content: z
    .string()
    .trim()
    .min(10, 'Full description must be at least 10 characters.')
    .max(5000, 'Keep the full description under 5,000 characters.'),
  description: z
    .string()
    .trim()
    .min(10, 'Short description must be at least 10 characters.')
    .max(300, 'Keep the short description under 300 characters.'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(120, 'Keep the name under 120 characters.'),
  faqs: z.array(optionalFaqSchema).max(MAX_FAQS),
  logoUrl: requiredUrlSchema,
  resourceLinks: z.array(optionalResourceLinkSchema).max(MAX_RESOURCE_LINKS),
  videoUrl: optionalUrlSchema,
  website: requiredUrlSchema
})

type SubmissionFormValues = z.infer<typeof submissionFormSchema>

const INITIAL_FORM_STATE: SubmissionFormValues = {
  category: '',
  content: '',
  description: '',
  faqs: [{ answer: '', question: '' }],
  logoUrl: HTTPS_PREFIX,
  name: '',
  resourceLinks: [{ label: '', url: '' }],
  videoUrl: '',
  website: HTTPS_PREFIX
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
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
      {required ? (
        <span aria-hidden="true" className="text-red-500">
          {' '}
          *
        </span>
      ) : null}
    </span>
  )
}

export function GitHubIssueSubmitForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copiedTheme, setCopiedTheme] = useState<BadgeTheme | null>(null)
  const [badgeInstructions, setBadgeInstructions] = useState<BadgeSubmissionInstructions | null>(
    null
  )
  const listingLabel = siteCopy.listingName.singularTitle
  const hasConfiguredIssueTarget = hasConfiguredGitHubIssueTarget(siteConfig)
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    reset,
    watch
  } = useForm<SubmissionFormValues>({
    defaultValues: INITIAL_FORM_STATE,
    mode: 'onChange',
    resolver: zodResolver(submissionFormSchema)
  })
  const {
    append: appendResourceLink,
    fields: resourceLinkFields,
    remove: removeResourceLink
  } = useFieldArray({
    control,
    name: 'resourceLinks'
  })
  const {
    append: appendFaq,
    fields: faqFields,
    remove: removeFaq
  } = useFieldArray({
    control,
    name: 'faqs'
  })
  const watchedFaqs = watch('faqs')
  const watchedResourceLinks = watch('resourceLinks')
  const hasPartiallyFilledFaq = watchedFaqs.some(
    faq => Boolean(faq.question.trim()) !== Boolean(faq.answer.trim())
  )
  const hasPartiallyFilledResourceLink = watchedResourceLinks.some(
    link => Boolean(link.label.trim()) !== !isEmptyUrlField(link.url)
  )

  const isSubmitDisabled =
    !hasConfiguredIssueTarget ||
    !isValid ||
    isSubmitting ||
    hasPartiallyFilledFaq ||
    hasPartiallyFilledResourceLink

  function handleValidSubmit(values: SubmissionFormValues): void {
    setSubmitError(null)

    if (!hasConfiguredIssueTarget) {
      setSubmitError('GitHub issue submission is disabled until this site config is complete.')
      return
    }

    const githubIssueUrl = buildSubmissionIssueUrl({
      category: values.category,
      description: values.description,
      faqs: values.faqs.filter(faq => faq.question.trim() && faq.answer.trim()),
      logoUrl: values.logoUrl,
      name: values.name,
      notes: values.content,
      resourceLinks: values.resourceLinks.filter(
        resourceLink => resourceLink.label.trim() && !isEmptyUrlField(resourceLink.url)
      ),
      videoUrl: values.videoUrl,
      website: values.website
    })

    setBadgeInstructions(
      buildBadgeSubmissionInstructions({
        githubIssueUrl,
        name: values.name,
        website: values.website
      })
    )
  }

  function handleReset(): void {
    reset(INITIAL_FORM_STATE)
    setSubmitError(null)
    setBadgeInstructions(null)
    setCopiedTheme(null)
  }

  function handleOpenGitHubIssue(): void {
    if (!badgeInstructions) {
      return
    }

    window.open(badgeInstructions.githubIssueUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleCopyBadge(theme: BadgeTheme): Promise<void> {
    if (!badgeInstructions) {
      return
    }

    await navigator.clipboard.writeText(badgeInstructions.badgeEmbeds[theme])
    setCopiedTheme(theme)
    setTimeout(() => setCopiedTheme(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{siteCopy.submitLabel}</h1>
      </div>

      {!hasConfiguredIssueTarget ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          GitHub issue submission is disabled until this site config provides a complete public
          issue target.
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {submitError}
        </div>
      ) : null}

      <form className="space-y-6" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel required>Name</FieldLabel>
            <input
              required
              type="text"
              aria-label="Name"
              aria-invalid={errors.name ? 'true' : 'false'}
              {...register('name')}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={`Example ${listingLabel}`}
            />
            <FieldError message={errors.name?.message} />
          </label>

          <label className="space-y-2">
            <FieldLabel required>Category</FieldLabel>
            <select
              required
              aria-label="Category"
              aria-invalid={errors.category ? 'true' : 'false'}
              {...register('category')}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a category</option>
              {categoryOptions.map(category => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.category?.message} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel required>Website URL</FieldLabel>
            <input
              required
              type="url"
              aria-label="Website URL"
              aria-invalid={errors.website ? 'true' : 'false'}
              {...register('website')}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://example.com"
            />
            <FieldError message={errors.website?.message} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel required>Logo URL</FieldLabel>
            <input
              required
              type="url"
              aria-label="Logo URL"
              aria-invalid={errors.logoUrl ? 'true' : 'false'}
              {...register('logoUrl')}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://example.com/logo.png"
            />
            <FieldError message={errors.logoUrl?.message} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Video URL</FieldLabel>
            <input
              type="url"
              aria-label="Video URL"
              aria-invalid={errors.videoUrl ? 'true' : 'false'}
              {...register('videoUrl')}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <FieldError message={errors.videoUrl?.message} />
          </label>
        </div>

        <label className="block space-y-2">
          <FieldLabel required>Short Description</FieldLabel>
          <textarea
            required
            aria-label="Short Description"
            aria-invalid={errors.description ? 'true' : 'false'}
            {...register('description')}
            className="min-h-24 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="One sentence describing what this listing covers."
          />
          <FieldError message={errors.description?.message} />
        </label>

        <label className="block space-y-2">
          <FieldLabel required>Full Description</FieldLabel>
          <textarea
            required
            aria-label="Full Description"
            aria-invalid={errors.content ? 'true' : 'false'}
            {...register('content')}
            className="min-h-48 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Markdown supported. Describe what makes this listing valuable."
          />
          <FieldError message={errors.content?.message} />
        </label>

        <div className="space-y-3">
          <span className="text-sm font-medium">FAQs</span>
          {faqFields.map((field, index) => {
            const faqError = errors.faqs?.[index]
            const watchedFaq = watchedFaqs[index]
            const questionMissing =
              Boolean(watchedFaq?.answer.trim()) && !watchedFaq?.question.trim()
            const answerMissing = Boolean(watchedFaq?.question.trim()) && !watchedFaq?.answer.trim()

            return (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2fr_auto]">
                <label className="space-y-1">
                  <span className="sr-only">FAQ question</span>
                  <input
                    type="text"
                    aria-invalid={faqError?.question ? 'true' : 'false'}
                    {...register(`faqs.${index}.question` as const)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Question"
                  />
                  <FieldError
                    message={
                      faqError?.question?.message || (questionMissing ? 'Enter a question.' : '')
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="sr-only">FAQ answer</span>
                  <input
                    type="text"
                    aria-invalid={faqError?.answer ? 'true' : 'false'}
                    {...register(`faqs.${index}.answer` as const)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Answer"
                  />
                  <FieldError
                    message={faqError?.answer?.message || (answerMissing ? 'Enter an answer.' : '')}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  disabled={faqFields.length <= 1}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                  aria-label="Remove FAQ"
                >
                  x
                </button>
              </div>
            )
          })}
          {faqFields.length < MAX_FAQS ? (
            <button
              type="button"
              onClick={() => appendFaq({ answer: '', question: '' })}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Add another FAQ
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium">Resource Links</span>
          {resourceLinkFields.map((field, index) => {
            const resourceLinkError = errors.resourceLinks?.[index]

            return (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2fr_auto]">
                <label className="space-y-1">
                  <span className="sr-only">Resource link label</span>
                  <input
                    type="text"
                    aria-invalid={resourceLinkError?.label ? 'true' : 'false'}
                    {...register(`resourceLinks.${index}.label` as const)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Label"
                  />
                  <FieldError message={resourceLinkError?.label?.message} />
                </label>
                <label className="space-y-1">
                  <span className="sr-only">Resource link URL</span>
                  <input
                    type="url"
                    aria-invalid={resourceLinkError?.url ? 'true' : 'false'}
                    {...register(`resourceLinks.${index}.url` as const)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="https://example.com/docs"
                  />
                  <FieldError message={resourceLinkError?.url?.message} />
                </label>
                <button
                  type="button"
                  onClick={() => removeResourceLink(index)}
                  disabled={resourceLinkFields.length <= 1}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                  aria-label="Remove link"
                >
                  x
                </button>
              </div>
            )
          })}
          {resourceLinkFields.length < MAX_RESOURCE_LINKS ? (
            <button
              type="button"
              onClick={() => appendResourceLink({ label: '', url: '' })}
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
            Submit
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-none border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-muted/50"
          >
            Reset
          </button>
        </div>
      </form>
      <Dialog
        open={Boolean(badgeInstructions)}
        onOpenChange={open => {
          if (!open) {
            setBadgeInstructions(null)
            setCopiedTheme(null)
          }
        }}
      >
        <DialogContent className="max-h-[min(760px,calc(100dvh-2rem))] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add the badge before opening GitHub</DialogTitle>
            <DialogDescription>
              Copy one badge snippet, publish it on your site, then open the GitHub issue. The issue
              workflow checks for this badge automatically and on each `/check-badge` comment.
            </DialogDescription>
          </DialogHeader>

          {badgeInstructions ? (
            <div className="space-y-5">
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Copy either badge snippet below.</li>
                  <li>Paste it into a public page on your submitted website.</li>
                  <li>Make sure the badge link is not marked `nofollow`.</li>
                  <li>Open the GitHub issue and finish creating the submission.</li>
                </ol>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(['light', 'dark'] as const).map(theme => (
                  <div key={theme} className="space-y-3 rounded-md border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold capitalize">{theme} badge</span>
                      <button
                        type="button"
                        onClick={() => void handleCopyBadge(theme)}
                        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copiedTheme === theme ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                        {copiedTheme === theme ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <img
                      src={badgeInstructions.badgePreviewPaths[theme]}
                      alt={`${theme === 'light' ? 'Light' : 'Dark'} Featured on ${
                        badgeInstructions.siteName
                      } badge`}
                      width={200}
                      height={50}
                      className="h-auto max-w-full"
                    />
                    <textarea
                      readOnly
                      value={badgeInstructions.badgeEmbeds[theme]}
                      rows={5}
                      className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none"
                      aria-label={`${theme} badge embed code`}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                The badge links to the future listing URL for {badgeInstructions.name}:{' '}
                <span className="break-all font-mono">{badgeInstructions.listingUrl}</span>
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setBadgeInstructions(null)}
              className="inline-flex items-center justify-center rounded-none border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-muted/50"
            >
              Back to form
            </button>
            <button
              type="button"
              onClick={handleOpenGitHubIssue}
              className="inline-flex items-center justify-center gap-2 rounded-none bg-foreground px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-foreground/90"
            >
              Open GitHub issue
              <ExternalLink className="size-4" />
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
