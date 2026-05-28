import { z } from 'zod'

export const PendingSubmissionSchema = z.object({
  category: z.string(),
  content: z.string().optional().default(''),
  description: z.string().min(1),
  faqs: z
    .array(
      z.object({
        answer: z.string(),
        question: z.string()
      })
    )
    .optional()
    .default([]),
  logoUrl: z.string().url().optional(),
  name: z.string().min(1),
  resourceLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string()
      })
    )
    .optional()
    .default([]),
  submittedAt: z.string(),
  token: z.string(),
  videoUrl: z.string().optional().default(''),
  verifyAttempts: z.number().default(0),
  website: z.string().url()
})

export const VerifiedSubmissionSchema = PendingSubmissionSchema.extend({
  publishedAt: z.string().optional(),
  verifiedAt: z.string()
})

export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>
export type VerifiedSubmission = z.infer<typeof VerifiedSubmissionSchema>
