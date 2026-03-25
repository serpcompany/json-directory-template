import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  canonicalTrialProductSchema,
  type CanonicalTrialProduct,
} from '../sites/trial-product-schema';

type TrialFaqEntryInput = {
  answer?: string;
  question?: string;
};

type TrialLinkInput = {
  label?: string;
  url?: string;
};

type CanonicalTrialProductInput = {
  category?: string;
  categories?: string[];
  content?: {
    body?: string;
    description?: string;
    faq?: TrialFaqEntryInput[];
    overview?: string;
    useCases?: string[];
    whyItExists?: string;
  };
  links?: {
    productPage?: string;
    related?: TrialLinkInput[];
  };
  media?: {
    images?: string[];
    logo?: string;
    video?: string;
  };
  product?: {
    categories?: string[];
    name?: string;
    primaryCategory?: string;
    productPage?: string;
    slug?: string;
    tagline?: string;
    title?: string;
  };
  relatedLinks?: TrialLinkInput[];
};

type LegacyTrialProduct = {
  contentMarketing?: {
    productPositioning?: {
      elevatorPitch?: string;
      useCases?: string[];
      valueProposition?: string;
    };
    storeListingCopy?: {
      faq?: TrialFaqEntryInput[];
      shortDescription?: string;
    };
  };
  technicalInfo?: {
    coreIdentity?: {
      extensionName?: string;
      slug?: string;
    };
    storeAndDistribution?: {
      helpCenter?: string;
      productPage?: string;
    };
  };
};

type TrialProduct = CanonicalTrialProductInput | LegacyTrialProduct;

export type TrialProducts = Record<string, TrialProduct>;

type TrialBuildOptions = {
  category: string;
  featuredCount?: number;
  publishedAt: string;
};

type CanonicalizeTrialProductsOptions = {
  defaultCategory?: string;
};

type WebsiteJsonEntry = {
  categories?: string[];
  content?: string;
  description: string;
  favicon: string;
  featured?: boolean;
  media?: {
    images?: string[];
    logo?: string;
    video?: string;
  };
  name: string;
  publishedAt: string;
  resourceLinks?: Array<{
    label: string;
    url: string;
  }>;
  slug: string;
  website: string;
};

type NormalizedTrialProduct = {
  category: string;
  categories: string[];
  content?: {
    body?: string;
    faq?: Array<{
      answer: string;
      question: string;
    }>;
  };
  description: string;
  media?: {
    images?: string[];
    logo?: string;
    video?: string;
  };
  name: string;
  resourceLinks?: Array<{
    label: string;
    url: string;
  }>;
  slug: string;
  website: string;
};

function buildFaviconUrl(websiteUrl: string): string {
  const domain = new URL(websiteUrl).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function cleanString(value?: string): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function escapeMdxText(value: string): string {
  return value.replaceAll('{', '\\{').replaceAll('}', '\\}');
}

function cleanStringArray(values?: string[]): string[] | undefined {
  const cleanedValues = values?.map((value) => value.trim()).filter(Boolean);
  return cleanedValues && cleanedValues.length > 0 ? cleanedValues : undefined;
}

function cleanCategoryArray(values?: string[]): string[] | undefined {
  return cleanStringArray(values);
}

function cleanMedia(value?: CanonicalTrialProduct['media']):
  | {
      images?: string[];
      logo?: string;
      video?: string;
    }
  | undefined {
  if (!value) {
    return undefined;
  }

  const images = cleanStringArray(value.images);
  const logo = cleanString(value.logo);
  const video = cleanString(value.video);

  if (!images && !logo && !video) {
    return undefined;
  }

  return {
    images,
    logo,
    video,
  };
}

function cleanFaqEntries(entries?: TrialFaqEntryInput[]):
  | Array<{
      answer: string;
      question: string;
    }>
  | undefined {
  const cleanedEntries = entries
    ?.map((entry) => {
      const answer = cleanString(entry.answer);
      const question = cleanString(entry.question);

      if (!answer || !question) {
        return undefined;
      }

      return {
        answer,
        question,
      };
    })
    .filter(
      (
        entry
      ): entry is {
        answer: string;
        question: string;
      } => Boolean(entry)
    );

  return cleanedEntries && cleanedEntries.length > 0
    ? cleanedEntries
    : undefined;
}

function cleanResourceLinks(links?: TrialLinkInput[]):
  | Array<{
      label: string;
      url: string;
    }>
  | undefined {
  const cleanedLinks = links
    ?.map((link) => {
      const label = cleanString(link.label);
      const url = cleanString(link.url);

      if (!label || !url) {
        return undefined;
      }

      return {
        label,
        url,
      };
    })
    .filter(
      (
        link
      ): link is {
        label: string;
        url: string;
      } => Boolean(link)
    );

  return cleanedLinks && cleanedLinks.length > 0 ? cleanedLinks : undefined;
}

function hasCanonicalTrialProductShape(
  product: TrialProduct
): product is CanonicalTrialProductInput {
  return (
    typeof product === 'object' &&
    product !== null &&
    ('category' in product ||
      'content' in product ||
      'media' in product ||
      'product' in product ||
      'relatedLinks' in product)
  );
}

function buildLegacyBodySections(
  legacyProduct: LegacyTrialProduct
): string | undefined {
  const overview = cleanString(
    legacyProduct.contentMarketing?.productPositioning?.elevatorPitch
  );
  const useCases = cleanStringArray(
    legacyProduct.contentMarketing?.productPositioning?.useCases
  );
  const whyItExists = cleanString(
    legacyProduct.contentMarketing?.productPositioning?.valueProposition
  );

  const sections = [
    overview ? `## Overview\n\n${escapeMdxText(overview)}` : '',
    whyItExists ? `## Why It Exists\n\n${escapeMdxText(whyItExists)}` : '',
    useCases && useCases.length > 0
      ? `## Offline use cases\n\n${useCases
          .map((useCase) => `- ${escapeMdxText(useCase)}`)
          .join('\n')}`
      : '',
  ].filter(Boolean);

  return sections.length > 0 ? sections.join('\n\n') : undefined;
}

function buildTransitionBodySections(
  content?: CanonicalTrialProductInput['content']
): string | undefined {
  if (!content) {
    return undefined;
  }

  const overview = cleanString(content.overview);
  const useCases = cleanStringArray(content.useCases);
  const whyItExists = cleanString(content.whyItExists);

  const sections = [
    overview ? `## Overview\n\n${escapeMdxText(overview)}` : '',
    whyItExists ? `## Why It Exists\n\n${escapeMdxText(whyItExists)}` : '',
    useCases && useCases.length > 0
      ? `## Offline use cases\n\n${useCases
          .map((useCase) => `- ${escapeMdxText(useCase)}`)
          .join('\n')}`
      : '',
  ].filter(Boolean);

  return sections.length > 0 ? sections.join('\n\n') : undefined;
}

function normalizeCanonicalTrialProduct(
  product: CanonicalTrialProductInput,
  fallbackSlug: string,
  defaultCategory: string
): NormalizedTrialProduct {
  const explicitCategories =
    cleanCategoryArray(product.product?.categories) ||
    cleanCategoryArray(product.categories);
  const legacyPrimaryCategory =
    cleanString(product.product?.primaryCategory) ||
    cleanString(product.category);
  const category =
    explicitCategories?.[0] || legacyPrimaryCategory || defaultCategory;
  const description =
    cleanString(product.product?.tagline) ||
    cleanString(product.content?.description);
  const name =
    cleanString(product.product?.title) || cleanString(product.product?.name);
  const slug = cleanString(product.product?.slug) || fallbackSlug;
  const website =
    cleanString(product.product?.productPage) ||
    cleanString(product.links?.productPage);

  if (!category) {
    throw new Error(`Missing category for ${slug}`);
  }

  const categories = [...new Set([category, ...(explicitCategories || [])])];

  if (!website) {
    throw new Error(`Missing product page for ${slug}`);
  }

  if (!name) {
    throw new Error(`Missing extension name for ${slug}`);
  }

  if (!description) {
    throw new Error(`Missing description for ${slug}`);
  }

  return {
    category,
    categories,
    content: {
      body:
        cleanString(product.content?.body) ||
        buildTransitionBodySections(product.content),
      faq: cleanFaqEntries(product.content?.faq),
    },
    description,
    media: cleanMedia(product.media),
    name,
    resourceLinks:
      cleanResourceLinks(product.relatedLinks) ||
      cleanResourceLinks(product.links?.related),
    slug,
    website,
  };
}

function normalizeLegacyTrialProduct(
  product: LegacyTrialProduct,
  fallbackSlug: string,
  defaultCategory: string
): NormalizedTrialProduct {
  const slug =
    cleanString(product.technicalInfo?.coreIdentity?.slug) || fallbackSlug;
  const website = cleanString(
    product.technicalInfo?.storeAndDistribution?.productPage
  );

  if (!website) {
    throw new Error(`Missing product page for ${slug}`);
  }

  const name = cleanString(product.technicalInfo?.coreIdentity?.extensionName);

  if (!name) {
    throw new Error(`Missing extension name for ${slug}`);
  }

  const description =
    cleanString(product.contentMarketing?.storeListingCopy?.shortDescription) ||
    cleanString(product.contentMarketing?.productPositioning?.elevatorPitch);

  if (!description) {
    throw new Error(`Missing description for ${slug}`);
  }

  const helpCenter = cleanString(
    product.technicalInfo?.storeAndDistribution?.helpCenter
  );

  return {
    category: defaultCategory,
    categories: [defaultCategory],
    content: {
      body: buildLegacyBodySections(product),
      faq: cleanFaqEntries(product.contentMarketing?.storeListingCopy?.faq),
    },
    description,
    media: undefined,
    name,
    resourceLinks: helpCenter
      ? [
          {
            label: 'Help Center',
            url: helpCenter,
          },
        ]
      : undefined,
    slug,
    website,
  };
}

function normalizeTrialProduct(
  product: TrialProduct,
  fallbackSlug: string,
  defaultCategory: string
): NormalizedTrialProduct {
  if (hasCanonicalTrialProductShape(product)) {
    return normalizeCanonicalTrialProduct(
      product,
      fallbackSlug,
      defaultCategory
    );
  }

  return normalizeLegacyTrialProduct(product, fallbackSlug, defaultCategory);
}

function buildContent(product: NormalizedTrialProduct): string | undefined {
  const body = cleanString(product.content?.body);
  const faq = product.content?.faq;

  const sections = [
    body || '',
    faq && faq.length > 0
      ? `## FAQ\n\n${faq
          .map(
            (faqEntry) =>
              `### ${escapeMdxText(faqEntry.question)}\n\n${escapeMdxText(
                faqEntry.answer
              )}`
          )
          .join('\n\n')}`
      : '',
  ].filter(Boolean);

  return sections.length > 0 ? sections.join('\n\n') : undefined;
}

function buildResourceLinks(
  product: NormalizedTrialProduct
): WebsiteJsonEntry['resourceLinks'] {
  return product.resourceLinks;
}

function buildCanonicalTrialProduct(
  product: NormalizedTrialProduct,
  defaultCategory?: string
): CanonicalTrialProduct {
  const canonicalProduct: CanonicalTrialProductInput = {
    product: {
      productPage: product.website,
      slug: product.slug,
      tagline: product.description,
      title: product.name,
    },
  };

  if (product.content?.body || product.content?.faq?.length) {
    canonicalProduct.content = {
      body: product.content?.body,
      faq: product.content?.faq,
    };
  }

  if (product.media) {
    canonicalProduct.media = product.media;
  }

  if (product.resourceLinks?.length) {
    canonicalProduct.relatedLinks = product.resourceLinks;
  }

  if (product.category !== defaultCategory || product.categories.length > 1) {
    canonicalProduct.product = {
      ...canonicalProduct.product,
      categories: product.categories,
    };
  }

  return canonicalTrialProductSchema.parse(canonicalProduct);
}

export function canonicalizeTrialProducts(
  products: TrialProducts,
  options: CanonicalizeTrialProductsOptions = {}
): Record<string, CanonicalTrialProduct> {
  return Object.fromEntries(
    Object.entries(products).map(([fallbackSlug, product]) => {
      const normalizedProduct = normalizeTrialProduct(
        product,
        fallbackSlug,
        options.defaultCategory || ''
      );

      return [
        fallbackSlug,
        buildCanonicalTrialProduct(normalizedProduct, options.defaultCategory),
      ];
    })
  );
}

export function buildTrialWebsiteEntries(
  products: TrialProducts,
  options: TrialBuildOptions
): WebsiteJsonEntry[] {
  return Object.entries(products)
    .map(([fallbackSlug, product], index) => {
      const normalizedProduct = normalizeTrialProduct(
        product,
        fallbackSlug,
        options.category
      );
      const normalizedWebsiteUrl = normalizedProduct.website.replace(/\/$/, '');
      const resourceLinks = buildResourceLinks(normalizedProduct);

      return {
        categories: normalizedProduct.categories,
        content: buildContent(normalizedProduct),
        description: normalizedProduct.description,
        favicon: buildFaviconUrl(normalizedWebsiteUrl),
        featured: index < (options.featuredCount ?? 6),
        name: normalizedProduct.name,
        publishedAt: options.publishedAt,
        slug: normalizedProduct.slug,
        website: normalizedWebsiteUrl,
        ...(normalizedProduct.media ? { media: normalizedProduct.media } : {}),
        ...(resourceLinks ? { resourceLinks } : {}),
      };
    })
    .sort((entryA, entryB) => entryA.name.localeCompare(entryB.name));
}

export function writeTrialWebsiteEntries(
  inputPath: string,
  outputPath: string,
  options: TrialBuildOptions
): void {
  const products = JSON.parse(
    readFileSync(resolve(inputPath), 'utf8')
  ) as TrialProducts;
  const entries = buildTrialWebsiteEntries(products, options);
  writeFileSync(resolve(outputPath), `${JSON.stringify(entries, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || 'data/listings.json';

  if (!inputPath) {
    throw new Error(
      'Usage: pnpm tsx scripts/trial-build.ts <input-json> [output-json]'
    );
  }

  writeTrialWebsiteEntries(inputPath, outputPath, {
    category: process.env.TRIAL_WEBSITE_CATEGORY || 'automation-workflow',
    featuredCount: Number(process.env.TRIAL_WEBSITE_FEATURED_COUNT || '6'),
    publishedAt:
      process.env.TRIAL_WEBSITE_PUBLISHED_AT ||
      new Date().toISOString().slice(0, 10),
  });
}
