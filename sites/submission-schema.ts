import { z } from 'zod';

export const PendingSubmissionSchema = z.object({
  token: z.string(), // short hash: url-slug + timestamp
  name: z.string(),
  website: z.string().url(),
  category: z.string(),
  description: z.string(),
  submittedAt: z.string(), // ISO 8601
  verifyAttempts: z.number().default(0),
});

export const VerifiedSubmissionSchema = PendingSubmissionSchema.extend({
  verifiedAt: z.string(), // ISO 8601
  publishedAt: z.string().optional(),
});

export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>;
export type VerifiedSubmission = z.infer<typeof VerifiedSubmissionSchema>;
