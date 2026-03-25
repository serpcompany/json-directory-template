# extensions.serp.co

## Source of truth

For `extensions.serp.co`, the normalized runtime dataset is the editable source:

- `data/listings.json`

This site currently uses `content.listingSource.kind = "listing-json"`, so there is no extra adapter file under this site folder.

## Local development

Run the site with the correct env contract:

```bash
pnpm dev:site -- --site extensions.serp.co
```
