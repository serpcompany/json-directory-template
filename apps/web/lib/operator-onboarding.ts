import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  canonicalTrialProductSchema,
  canonicalTrialProductsSchema,
  type CanonicalTrialProduct,
} from '@thedaviddias/site-contract/trial-product-schema';
import { categories } from '@/lib/categories';

const categorySlugValues = categories.map((category) => category.slug) as [
  string,
  ...string[]
];

export const operatorSiteDocumentSchema = z.object({
  categoryLabels: z.record(z.string().trim().min(1)).default({}),
  defaultCategory: z.enum(categorySlugValues),
  description: z.string().trim().min(1),
  docsLabel: z.string().trim().min(1),
  docsRouteBasePath: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  domain: z.string().trim().min(1),
  featuredCount: z.number().int().nonnegative(),
  githubIssueOwner: z.string().trim().min(1),
  githubIssueRepo: z.string().trim().min(1),
  githubIssuesUrl: z.string().url(),
  githubRepoUrl: z.string().url(),
  githubUrl: z.string().url(),
  listingPluralLabel: z.string().trim().min(1),
  listingRouteBasePath: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  listingSingularLabel: z.string().trim().min(1),
  name: z.string().trim().min(1),
  networkLabel: z.string().trim().min(1),
  networkRouteBasePath: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  publicUrl: z.string().url(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  redditUrl: z.string().url(),
  siteId: z.string().trim().min(1),
  submitLabel: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  twitterUrl: z.string().url(),
});

export const operatorOnboardingDocumentSchema = z
  .object({
    listings: z.array(canonicalTrialProductSchema),
    site: operatorSiteDocumentSchema,
  })
  .superRefine((document, context) => {
    const seenSlugs = new Set<string>();

    document.listings.forEach((listing, index) => {
      const slug = listing.product.slug.trim();

      if (!slug) {
        return;
      }

      if (seenSlugs.has(slug)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate listing slug: ${slug}`,
          path: ['listings', index, 'product', 'slug'],
        });
        return;
      }

      seenSlugs.add(slug);
    });
  });

export type OperatorOnboardingDocument = z.infer<
  typeof operatorOnboardingDocumentSchema
>;
export type OperatorOnboardingSiteDocument = z.infer<
  typeof operatorSiteDocumentSchema
>;

function setCategoryEnumChoices(schema: Record<string, unknown>): void {
  const properties = schema.properties as Record<string, unknown>;
  const productSchema = properties.product as Record<string, unknown>;
  const productProperties = productSchema.properties as Record<string, unknown>;

  productProperties.categories = {
    ...(productProperties.categories as Record<string, unknown>),
    description:
      'Ordered category list. The first category becomes the canonical route category.',
    items: {
      enum: categorySlugValues,
      type: 'string',
    },
  };
}

export function buildOperatorOnboardingExport(
  document: OperatorOnboardingDocument
) {
  const parsedDocument = operatorOnboardingDocumentSchema.parse(document);

  const productsJson = canonicalTrialProductsSchema.parse(
    Object.fromEntries(
      parsedDocument.listings.map((listing) => [listing.product.slug, listing])
    )
  );

  return {
    productsJson,
    siteConfig: {
      build: {
        artifactDir: `dist/sites/${parsedDocument.site.siteId}`,
      },
      content: {
        listingSource: {
          category: parsedDocument.site.defaultCategory,
          featuredCount: parsedDocument.site.featuredCount,
          kind: 'trial-products-json' as const,
          outputPath: 'data/listings.json',
          path: `sites/${parsedDocument.site.siteId}/products.json`,
          publishedAt: parsedDocument.site.publishedAt,
        },
      },
      copy: {
        categoryLabels: parsedDocument.site.categoryLabels,
        docsLabel: parsedDocument.site.docsLabel,
        listingName: {
          plural: parsedDocument.site.listingPluralLabel,
          singular: parsedDocument.site.listingSingularLabel,
        },
        networkLabel: parsedDocument.site.networkLabel,
        submitLabel: parsedDocument.site.submitLabel,
      },
      id: parsedDocument.site.siteId,
      routes: {
        docsBasePath: parsedDocument.site.docsRouteBasePath,
        listingBasePath: parsedDocument.site.listingRouteBasePath,
        networkBasePath: parsedDocument.site.networkRouteBasePath,
      },
      site: {
        description: parsedDocument.site.description,
        domain: parsedDocument.site.domain,
        name: parsedDocument.site.name,
        publicUrl: parsedDocument.site.publicUrl,
        tagline: parsedDocument.site.tagline,
      },
      social: {
        githubIssueOwner: parsedDocument.site.githubIssueOwner,
        githubIssueRepo: parsedDocument.site.githubIssueRepo,
        githubIssuesUrl: parsedDocument.site.githubIssuesUrl,
        githubRepoUrl: parsedDocument.site.githubRepoUrl,
        githubUrl: parsedDocument.site.githubUrl,
        redditUrl: parsedDocument.site.redditUrl,
        twitterUrl: parsedDocument.site.twitterUrl,
      },
    },
  };
}

export function createEmptyOperatorListing(
  defaultCategory: string
): CanonicalTrialProduct {
  return {
    content: {
      faq: [],
    },
    product: {
      categories: [defaultCategory],
      productPage: 'https://example.com',
      slug: '',
      tagline: '',
      title: '',
    },
    relatedLinks: [],
  } as CanonicalTrialProduct;
}

export const operatorSiteFormSchema = (() => {
  const schema = zodToJsonSchema(operatorSiteDocumentSchema, {
    $refStrategy: 'none',
  }) as Record<string, unknown>;

  const siteProperties = schema.properties as Record<string, unknown>;

  schema.title = 'Site config';
  schema.description = 'Site identity, route vocabulary, and listing defaults';
  siteProperties.defaultCategory = {
    ...(siteProperties.defaultCategory as Record<string, unknown>),
    enum: categorySlugValues,
  };

  return schema;
})();

export const operatorListingFormSchema = (() => {
  const schema = zodToJsonSchema(canonicalTrialProductSchema, {
    $refStrategy: 'none',
  }) as Record<string, unknown>;

  setCategoryEnumChoices(schema);
  schema.title = 'Listing';
  schema.description =
    'One listing/product record that will be included in products.json';

  return schema;
})();

export const operatorOnboardingFormSchema = (() => {
  const schema = zodToJsonSchema(operatorOnboardingDocumentSchema, {
    $refStrategy: 'none',
  }) as Record<string, unknown>;

  const properties = schema.properties as Record<string, unknown>;
  const siteSchema = properties.site as Record<string, unknown>;
  const siteProperties = siteSchema.properties as Record<string, unknown>;
  const listingsSchema = properties.listings as Record<string, unknown>;
  const listingItems = listingsSchema.items as Record<string, unknown>;

  siteSchema.title = 'Site config';
  siteSchema.description =
    'Site identity, route vocabulary, and listing defaults';
  listingsSchema.title = 'Listings';
  listingsSchema.description =
    'The main product/listing records that will become products.json';
  siteProperties.defaultCategory = {
    ...(siteProperties.defaultCategory as Record<string, unknown>),
    enum: categorySlugValues,
  };
  setCategoryEnumChoices(listingItems);

  return schema;
})();
