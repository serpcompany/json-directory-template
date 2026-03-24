'use client'

import { siteCopy } from '@/lib/site-copy'

/**
 * Guidelines section for the submit form
 */
export function SubmitFormGuidelines() {
  const listingLabel = siteCopy.listingName.singular

  return (
    <div className="mt-12 border-t border-muted pt-12">
      <h2 className="text-xl font-semibold mb-6">Submission Tips</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-base">What reviewers need</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">•</span>
              <span>The main URL for the {listingLabel} you are submitting</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">•</span>
              <span>A short description that explains what the {listingLabel} covers</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">•</span>
              <span>Any helpful docs, examples, or support links in your reviewer notes</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-base">Best Practices</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>Keep descriptions clear and concise</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>Link to docs, examples, or support pages when they help reviewers</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>Mention key features and capabilities</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>Add reviewer notes when a submission needs extra context</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label="Information icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Before you submit</p>
            <p className="text-amber-700 dark:text-amber-300">
              Make sure the public URLs in this form are live and ready for review so the
              submission can be checked without follow-up.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
