# Listing rewriter brief

Give this file to each rewriter subagent together with its list of slugs. It is the
working version of the "Unique content rule" in `docs/knowledge/listing-data-contract.md`
for `scripts/listing-rewrite.ts` (serpcompany/json-directory-template#156, #157, #161). The
contract lists which rules `check` applies in each mode.

Run every command from the repo root. Don't touch git, and don't edit anything except your
own `tmp/listing-rewrites/output/<slug>.json` files. Never edit `tmp/listing-rewrites/input/`;
`check` refuses inputs that changed after `prepare`.

## Input and output

For each slug:

- Read `tmp/listing-rewrites/input/<slug>.json`. It has `source.tagline`, `source.body` and
  `source.faq` (the copy you are replacing), `facts` (what must survive the rewrite) and
  sometimes `conflicts` (places where the source contradicts itself).
- Write `tmp/listing-rewrites/output/<slug>.json` with exactly this shape:

```json
{
  "slug": "<slug>",
  "tagline": "one sentence",
  "body": "## Heading\n\nmarkdown...",
  "faq": [{ "question": "...?", "answer": "..." }]
}
```

## What to write

- `tagline`: one new sentence. Don't reuse the source tagline's wording, and don't open it
  the way other listings open theirs (e.g. "A desktop browser extension that ...").
- `body`: markdown with `##` sections and bullet lists. Cover every topic the source covers:
  what it does, why it's useful, features, how it works, supported browsers and OS and what
  isn't supported, limitations, region, and every permission with why it's needed. Choose
  your own headings and order, with at least 3 `##` sections, no `#` h1, no URLs, and no
  reviews or testimonials.
- Write each permission as inline code at the start of its own list item, followed by why
  it's needed: ``- `downloads`: ...``. Use the exact names from the source.
- `faq`: rewrite **every** source FAQ entry (same count or more). Rephrase each question and
  write a new answer. Leave out any "Is this legal?" question; `apply` adds the site's
  standard one.

## Rules

- Use new wording and new sentence structure. Swapping synonyms line by line or reordering
  bullets doesn't count. Don't copy any run of 6 or more words from the source.
- Every listing must read differently from every other listing, not only from its source.
  Use a different opening move, different headings, step labels and FAQ question wording,
  and a different rhythm. Don't build a template and swap in the platform name. `check`
  fails shared sentences, reused FAQ questions and identical heading sequences across
  listings.
- Keep the facts exactly: platform name, supported and unsupported browsers and OS, output
  formats, quality options, permissions and their purpose, save location or folder,
  limitations (including "one at a time" and "keep the tab open until ..."), and region.
  Keep a "recommended" as a recommendation, not a rule.
- **No pricing or trial language at all**, even when the source has it: no prices, payments,
  plans, one-time vs subscription, lifetime licences, trials, free-download counts, credit
  cards, refunds or discounts. Where a permission's reason mentions trial state, describe it
  without the word (e.g. "activation and local preference state"). `check` fails any of it.
  "Subscriptions" in the sense of a user's subscriptions to creators on the platform is fine.
- Don't add anything that isn't in the source: features, benefits stated as features,
  numbers, browsers or formats, or claims about why content disappears. Avoid spelled-out
  numbers (two, three, ...) unless the source has that number.
- If `conflicts` is present, keep every fact the source states and don't pick a side in a
  way that contradicts another part of the source. Mention the conflict in your report.
- Don't change product names, slugs, URLs or category values.
- Use plain, readable language. No keyword stuffing and no hype.
- Bodies and FAQs render as MDX. Put tags, route shapes such as `/videos/<id>/` and anything
  else with a `<` in backticks, in the body and the FAQ; a `<` followed by a space is fine. In
  the body, braces go in backticks too. In FAQ text write braces plainly: the build escapes
  them, and inside backticks they would show as `\{`.

## Existing listings (`prepare --existing`)

When the inputs say `"mode": "existing"` you are replacing a site's own copy, and `check`
also fails:

- any 8-word run copied from the source (browser, OS and format lists excepted);
- internal pipeline or writer notes: "handoff", "candidate", "generated stubs", "adapter
  probing", "confidence rating", "readiness", "release-ready", "extraction QA", "the
  listing", "the repository documentation", "claimed here". Present the product as available
  and state real limitations plainly;
- the old template headings: Troubleshooting, Fixes, Problems, Errors, Notes, About ...,
  Supported Formats, Step by step, Who it's for, Use cases, Installation Instructions, Trial.
  Fold troubleshooting facts into the FAQ or a short limits paragraph, in your own order;
- a body that opens with "<Name> is a ..." or "The extension is a ...";
- licence wording ("licence", "license", "licensed", "licensing"): say "activation". "Licensed"
  is fine only where it describes the content and the source says so (licensed stock images);
- source code references such as `popup.js:44` or `background.js`;
- raw `{}` route placeholders, and naming the product "<Platform> Downloader" when its title is
  different;
- a tagline outside 70–160 characters (it is the page's meta description).

Facts are read from the source without its reviews and internal notes, and the body may be
shorter than in new mode (0.45 of the cleaned source rather than 0.6), but every fact still has
to survive.

## Self-check (required)

After writing each output, run:

```bash
pnpm tsx scripts/listing-rewrite.ts check --slugs <slug>
```

It prints PASS or FAIL with similarity scores (LCS ratio / 5-word-shingle Jaccard, both
must be at most 0.5) and any issues. Fix the output and run it again until it passes. Don't
game the checker, for example by dropping facts or adding filler. If a check looks wrong,
say so in your report.

Report back the slugs you wrote, the final check line for each, and anything you skipped or
found questionable in the source. If you decline or can't rewrite a slug, skip it and say
why. Never copy the source text into an output.
