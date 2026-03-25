'use client';

import { useDeferredValue, useState } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { UiSchema } from '@rjsf/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  buildOperatorOnboardingExport,
  createEmptyOperatorListing,
  operatorOnboardingDocumentSchema,
  operatorListingFormSchema,
  operatorSiteFormSchema,
  type OperatorOnboardingDocument,
} from '@/lib/operator-onboarding';

const operatorSiteUiSchema: UiSchema = {
  categoryLabels: {
    'ui:options': {
      addable: true,
    },
  },
};

const operatorListingUiSchema: UiSchema = {
  content: {
    body: {
      'ui:widget': 'textarea',
    },
  },
};

function downloadJsonFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(objectUrl);
}

type SiteOnboardingFormProps = {
  initialDocument: OperatorOnboardingDocument;
};

export function SiteOnboardingForm({
  initialDocument,
}: SiteOnboardingFormProps) {
  const [formData, setFormData] =
    useState<OperatorOnboardingDocument>(initialDocument);
  const [selectedListingIndex, setSelectedListingIndex] = useState(0);
  const [listingFilter, setListingFilter] = useState('');
  const deferredFormData = useDeferredValue(formData);

  const parsedDocument =
    operatorOnboardingDocumentSchema.safeParse(deferredFormData);
  const exportPayload = parsedDocument.success
    ? buildOperatorOnboardingExport(parsedDocument.data)
    : null;
  const siteConfigJson = exportPayload
    ? `${JSON.stringify(exportPayload.siteConfig, null, 2)}\n`
    : '';
  const productsJson = exportPayload
    ? `${JSON.stringify(exportPayload.productsJson, null, 2)}\n`
    : '';
  const validationMessages = parsedDocument.success
    ? []
    : parsedDocument.error.issues.map((issue) => {
        const pathLabel = issue.path.length > 0 ? issue.path.join('.') : 'form';

        return `${pathLabel}: ${issue.message}`;
      });
  const filteredListings = formData.listings
    .map((listing, index) => ({
      index,
      listing,
    }))
    .filter(({ listing }) => {
      if (!listingFilter.trim()) {
        return true;
      }

      const filterValue = listingFilter.trim().toLowerCase();
      const title = listing.product.title.toLowerCase();
      const slug = listing.product.slug.toLowerCase();

      return title.includes(filterValue) || slug.includes(filterValue);
    });
  const selectedListing = formData.listings[selectedListingIndex] ?? null;

  function updateSite(nextSite: OperatorOnboardingDocument['site']): void {
    setFormData((current) => ({
      ...current,
      site: nextSite,
    }));
  }

  function updateListing(
    index: number,
    nextListing: OperatorOnboardingDocument['listings'][number]
  ): void {
    setFormData((current) => ({
      ...current,
      listings: current.listings.map((listing, listingIndex) =>
        listingIndex === index ? nextListing : listing
      ),
    }));
  }

  function addListing(): void {
    setFormData((current) => ({
      ...current,
      listings: [
        ...current.listings,
        createEmptyOperatorListing(current.site.defaultCategory),
      ],
    }));
    setSelectedListingIndex(formData.listings.length);
  }

  function removeSelectedListing(): void {
    if (!selectedListing) {
      return;
    }

    setFormData((current) => ({
      ...current,
      listings: current.listings.filter(
        (_, index) => index !== selectedListingIndex
      ),
    }));
    setSelectedListingIndex((currentIndex) => {
      if (formData.listings.length <= 1) {
        return 0;
      }

      return Math.max(0, currentIndex - 1);
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-semibold">Site onboarding</h1>
          </CardTitle>
          <CardDescription>
            Operator-only surface for shaping site config and listing data
            before export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            This route is internal only. It is for local operator workflows, not
            for the public site.
          </div>

          <div className="text-sm text-muted-foreground">
            Required and optional fields come from the current onboarding
            contract. The JSON preview and export buttons only enable when the
            form is valid.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-2xl font-semibold">
                Site identity and config
              </h2>
            </CardTitle>
            <CardDescription>
              Edit the site-level settings that feed `site-config` output.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              schema={operatorSiteFormSchema}
              validator={validator}
              formData={formData.site}
              uiSchema={operatorSiteUiSchema}
              liveValidate
              noHtml5Validate
              showErrorList={false}
              onChange={(event) => {
                updateSite(
                  event.formData as OperatorOnboardingDocument['site']
                );
              }}
            >
              <div className="hidden" />
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-2xl font-semibold">Listings</h2>
            </CardTitle>
            <CardDescription>
              Pick one listing to edit at a time. Add new ones as needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={addListing}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Add listing
            </button>

            <input
              type="search"
              value={listingFilter}
              onChange={(event) => setListingFilter(event.target.value)}
              placeholder="Filter by title or slug"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />

            <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {filteredListings.map(({ index, listing }) => {
                const isActive = index === selectedListingIndex;
                const title =
                  listing.product.title.trim() || 'Untitled listing';
                const slug = listing.product.slug.trim() || 'missing-slug';

                return (
                  <button
                    key={`${slug}-${index}`}
                    type="button"
                    onClick={() => setSelectedListingIndex(index)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="truncate text-sm font-semibold">
                      {title}
                    </div>
                    <div
                      className={`truncate text-xs ${
                        isActive
                          ? 'text-background/80'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {slug}
                    </div>
                  </button>
                );
              })}

              {filteredListings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No listings match that filter.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl font-semibold">Listing editor</h2>
          </CardTitle>
          <CardDescription>
            Edit the selected listing fields that will become one record in
            `products.json`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {selectedListing
                ? `Editing ${
                    selectedListing.product.title ||
                    selectedListing.product.slug ||
                    'new listing'
                  }`
                : 'No listing selected yet.'}
            </div>

            <button
              type="button"
              onClick={removeSelectedListing}
              disabled={!selectedListing}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove selected listing
            </button>
          </div>

          {selectedListing ? (
            <div className="space-y-6">
              <Form
                key={selectedListingIndex}
                schema={operatorListingFormSchema}
                validator={validator}
                formData={selectedListing}
                uiSchema={operatorListingUiSchema}
                liveValidate
                noHtml5Validate
                showErrorList={false}
                onChange={(event) => {
                  updateListing(
                    selectedListingIndex,
                    event.formData as OperatorOnboardingDocument['listings'][number]
                  );
                }}
              >
                <div className="hidden" />
              </Form>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Add a listing to start shaping the `products.json` payload.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl font-semibold">Validation and export</h2>
          </CardTitle>
          <CardDescription>
            Review validation state and export the generated payloads when the
            form is valid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {parsedDocument.success ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
              Ready for export. The generated payloads below are valid against
              the current onboarding contract.
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-medium">
                Fix these validation issues before export is available.
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {validationMessages.slice(0, 10).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">site-config payload</h3>
                <button
                  type="button"
                  disabled={!exportPayload}
                  onClick={() =>
                    downloadJsonFile(
                      'site-config.override.json',
                      siteConfigJson
                    )
                  }
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download site-config JSON
                </button>
              </div>
              <textarea
                readOnly
                value={siteConfigJson}
                className="min-h-[28rem] w-full rounded-lg border border-border bg-muted/20 p-3 font-mono text-xs"
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">products.json payload</h3>
                <button
                  type="button"
                  disabled={!exportPayload}
                  onClick={() =>
                    downloadJsonFile('products.json', productsJson)
                  }
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download products.json
                </button>
              </div>
              <textarea
                readOnly
                value={productsJson}
                className="min-h-[28rem] w-full rounded-lg border border-border bg-muted/20 p-3 font-mono text-xs"
              />
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
