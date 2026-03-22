# README

A 'directory' style website template for a cohort of products. 
The goal is to keep the site super simple, lightweight, and fully runnable from a github repo / github pages setu.
We want to rely on a few extra services as possible to keep it very low cost and try to automate as much as possible.

**Examples:**

- https://github.com/thedaviddias/llms-txt-hub
- https://github.com/leerob/directories (cursor.directory)
- https://github.com/devinschumacher/gh-directory
- https://github.com/marcelscruz/dev-resources
- https://github.com/serptools/serptools.github.io
- https://github.com/boxingundefeated/boxingundefeated.github.io
- https://github.com/devinschumacher/nuxt-directory-template
- https://github.com/serpcompany/wiki.serp.co/

## Features

- Data: 
  - JSON files power the data on the site (entities; primarily products of some kind) as a source of truth; - does not rely on external database (ie: postgres, neon)
  - Data quality & content is protected through: defined JSON schema/shape, validations
  - Github workflows build and deploy the site to github pages, building the pages from the data in the JSONs; mdoes not rely on external server (ie: vercel, etc.)

- Automate:
  - Github pages sites can be built and deployed to the repo/website, or to multiple repositories / websites
  - Github actions handle any content updating and re-deploys when content is added or changes, etc. 

- Pages:
  - The sites are meant to rank for individual product terms & keyword category terms
  - Product detail pages represent entities listed on the directory. They will have some light page structure to accomodate data fields that are common to all entities and but the rest should be rendered in an unstructured area
  - Category archive type pages are optimized to rank for keyword terms (ie: VPN Extensions)
  - a Blog can also be used to post any type of content


We organize projects into primary categories (🤖 AI & ML, 💻 Developer Tools, 📊 Data & Analytics, ⚡ Integration & Automation, ☁️ Infrastructure & Cloud, 🔒 Security & Identity) and secondary categories (personal, agency, e-commerce, education, media, international, other).

---

If we can use this project as a starter it has everything we want: https://github.com/thedaviddias/llms-txt-hub
We do need to strip away alot of things from it though that we dont need (supabase, services, etc.)