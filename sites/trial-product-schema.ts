import { z } from 'zod';
import { isValidAssetReference } from '../apps/web/lib/asset-reference';

export const trialFaqEntrySchema = z.object({
  answer: z.string().trim().min(1, 'faq.answer is required'),
  question: z.string().trim().min(1, 'faq.question is required'),
});

export const trialLinkSchema = z.object({
  label: z.string().trim().min(1, 'relatedLinks.label is required'),
  url: z.string().url('relatedLinks.url must be a valid URL'),
});

export const trialMediaSchema = z
  .object({
    images: z
      .array(
        z.string().refine(isValidAssetReference, {
          message:
            'media.images must contain valid HTTPS URLs or root-relative asset paths',
        })
      )
      .optional(),
    logo: z
      .string()
      .refine(isValidAssetReference, {
        message:
          'media.logo must be a valid HTTPS URL or root-relative asset path',
      })
      .optional(),
    video: z
      .string()
      .refine(isValidAssetReference, {
        message:
          'media.video must be a valid HTTPS URL or root-relative asset path',
      })
      .optional(),
  })
  .refine(
    (media) => Boolean(media.images?.length || media.logo || media.video),
    {
      message: 'media must include at least one URL',
    }
  );

export const canonicalTrialProductSchema = z.object({
  content: z
    .object({
      body: z.string().trim().min(1).optional(),
      faq: z.array(trialFaqEntrySchema).optional(),
    })
    .optional(),
  media: trialMediaSchema.optional(),
  product: z.object({
    categories: z
      .array(z.string().trim().min(1, 'product.categories must not be empty'))
      .min(1, 'product.categories must include at least one slug')
      .optional(),
    productPage: z.string().url('product.productPage must be a valid URL'),
    slug: z.string().trim().min(1, 'product.slug is required'),
    tagline: z.string().trim().min(1, 'product.tagline is required'),
    title: z.string().trim().min(1, 'product.title is required'),
  }),
  relatedLinks: z.array(trialLinkSchema).optional(),
});

export const canonicalTrialProductsSchema = z.record(
  z.string().trim().min(1),
  canonicalTrialProductSchema
);

export type CanonicalTrialProduct = z.infer<typeof canonicalTrialProductSchema>;
export type CanonicalTrialProducts = z.infer<typeof canonicalTrialProductsSchema>;
export type TrialFaqEntry = z.infer<typeof trialFaqEntrySchema>;
export type TrialLink = z.infer<typeof trialLinkSchema>;
export type TrialMedia = z.infer<typeof trialMediaSchema>;
