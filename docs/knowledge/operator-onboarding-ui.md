# Operator Onboarding UI

Use the operator onboarding UI when you want an optional local form-driven view of the site setup and listing payloads.

## What it is

- local/operator-only
- not part of the public site surface
- not under `/tools`
- not intended for public deployment
- stripped out of the normal `pnpm build:site` publish artifact
- not the default maintainer workflow

Current local route:

- `/operator/onboard-site`

## How to open it

Run:

```bash
pnpm dev:operator -- --site your-site-id
```

Then open:

```txt
http://localhost:3005/operator/onboard-site
```

## What it gives you

- required versus optional fields in a real form
- inline validation against the current onboarding contract
- a generated `site-config` payload preview
- a generated `products.json` payload preview
- JSON download buttons for both payloads

## When to use it

Use the operator UI when:

- onboarding a new site
- reviewing what fields are required
- preparing or validating a larger batch of listing data
- you want JSON output without hand-authoring the full source files first

Edit the checked-in files directly when:

- making a quick one-off change
- adjusting a few product names or links
- changing existing config in a controlled engineering flow

## Important limitation

Right now this operator UI is aimed at adapter-driven checked-in sources that emit `products.json`.
Treat it as an optional helper, not as the canonical workflow for every site.
