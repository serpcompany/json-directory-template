# Rebrand Runbook

Use this when turning the starter into a new site brand. The goal is to replace the checked-in identity, assets, links, and public copy without hunting through the app.

## 1. Update the checked-in site config

Edit `sites/<site-id>/site-config.ts` and confirm these are real values for the site:

- `site.name`
- `site.domain`
- `site.publicUrl`
- `site.description`
- `site.tagline`
- `social.*`
- `copy.*`
- `routes.*`
- `features.*`

The full field guide lives in [site-config.md](./knowledge/site-config.md).

## 2. Replace brand assets

Add site-owned assets under `sites/<site-id>/assets/` and wire them in site config:

- `branding.favicon`
- `branding.logo`
- `branding.opengraphImage`

The active shell and metadata surfaces now read from checked-in site config and staged site assets. Direct edits in app shell files should be the exception, not the normal path.

## 3. Review site-owned content

Check these locations and replace any starter-default wording that should be site-specific:

- `sites/<site-id>/site-content.ts`
- `packages/content/data/about/about.mdx`
- `packages/content/data/legal/*.mdx`
- `packages/content/data/docs/*.mdx`
- `packages/content/data/guides/*.mdx`
- `packages/content/data/resources/*.mdx`

## 4. Review submit and outbound links

Make sure the site points at the correct repo and issue flow:

- `social.githubUrl`
- `social.githubRepoUrl`
- `social.githubIssuesUrl`
- `social.githubIssueOwner`
- `social.githubIssueRepo`
- `social.githubIssueTemplate`

Also review any site-owned extras in `sites/<site-id>/site-content.ts`, such as network links or external resources.

## 5. Verify the result

Run:

```bash
pnpm validate:site -- --site <site-id>
pnpm build:site -- --site <site-id>
```

Then verify:

- the homepage title, description, and shell branding match the new site
- header/footer links point to the right destinations
- favicon and Open Graph image are replaced
- legal pages use the right brand and contact details
- submit flow points at the right repository

## Related references

- Public checklist: `packages/content/data/docs/rebrand-checklist.mdx`
- Field reference: [site-config.md](./knowledge/site-config.md)
- Build/deploy flow: [BUILD_PIPELINE.md](./BUILD_PIPELINE.md)
