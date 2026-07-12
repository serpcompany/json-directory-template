# Phase 1 Registry Mapping

## Completion Status

As of 2026-07-13, all mapped Phase 1 public surfaces have been implemented on
`agent/shadcnblocks-source-adoption` and published through PR #147. The six adapted
ShadcnBlocks component families are owned under
`packages/design-system/components/shadcnblocks`, while behavior and public route
composition remain in `packages/web-core`.

The implementation is pending final PR checks, review, and merge. This document uses
"ShadcnBlocks-backed" to describe the mapped public UI surfaces; it does not claim
that routing, data loading, filtering, favorites, analytics, metadata, or schema have
been replaced by ShadcnBlocks.

The listing-card fallback contract now resolves to the local
`/listing-logos/favicon-fallback-512x512.png` asset distributed with each app. Google
and gstatic favicon services are not fallback candidates.

Status: source-of-truth mapping for Phase 1B plus Phase 1C correction pass.

Pilot target: `serpdownloaders.com`.

Scope: shared public directory surfaces in `packages/web-core`. Installed
ShadcnBlocks/shadcn source must live under `packages/design-system`; no generated
ShadcnBlocks source should be committed directly under `packages/web-core`.

## Evidence

- Current branch at mapping time: `agent/phase-1-registry-mapping`.
- Current tracked/untracked worktree before edits: clean.
- Registry configuration verified in
  `packages/design-system/components.json`: `@shadcnblocks` points at
  `https://www.shadcnblocks.com/r/{name}` with the `SHADCNBLOCKS_API_KEY`
  environment header.
- Existing shadcn primitives under `packages/design-system/components/shadcn`
  include `badge`, `button`, `card`, `command`, `drawer`, `input`,
  `scroll-area`, `separator`, `sheet`, `tabs`, and `toggle-group`.
- Existing design-system exports in `packages/design-system/package.json` expose
  those primitives through package exports consumed by `packages/web-core`.
- Initial mapping found no ShadcnBlocks-owned block source installed under
  `packages/design-system`.
- Correction pass on 2026-07-11 added ShadcnBlocks-derived reusable source under
  `packages/design-system/components/shadcnblocks` and package exports under
  `@thedaviddias/design-system/shadcnblocks/*`.
- Registry inspection date: 2026-07-11.
- `pnpm dlx shadcn@latest --version` resolved to shadcn CLI `4.13.0`.

Registry inspection was run from `packages/design-system` with the verified local
env file sourced and without printing the token:

```bash
set -a; source /Users/devin/dev/repos/shadcnblocks/.env; set +a
pnpm dlx shadcn@latest view @shadcnblocks/product-card1 @shadcnblocks/product-list1 @shadcnblocks/sidebar1 @shadcnblocks/application-shell1 @shadcnblocks/navbar1
pnpm dlx shadcn@latest search @shadcnblocks --query command --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query empty --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query drawer --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query product --limit 30 --json
pnpm dlx shadcn@latest view @shadcnblocks/input-input-types-4 @shadcnblocks/command-command-standard-1 @shadcnblocks/empty-empty-search-1 @shadcnblocks/sheet-sheet-navigation-1 @shadcnblocks/toggle-group-toggle-group-standard-3
pnpm dlx shadcn@latest view @shadcnblocks/combobox-combobox-standard-1 @shadcnblocks/drawer-drawer-left-2 @shadcnblocks/empty-empty-actions-1 @shadcnblocks/tabs-tabs-standard-1 @shadcnblocks/button-link
```

Registry-name correction: the local ShadcnBlocks component catalog examples such
as `@shadcnblocks/command-standard-1` and `@shadcnblocks/empty-standard-1`
did not resolve through the configured registry. The valid inspected names used
the current registry naming format, for example
`@shadcnblocks/command-command-standard-1` and
`@shadcnblocks/empty-empty-search-1`.

Observed source facts:

- `product-card1` and `product-list1` include ecommerce image, price, sale, and
  product badge source.
- `sidebar1` and `application-shell1` include shadcn sidebar provider/inset
  ownership, rails, breadcrumbs, and dashboard-style placeholder content.
- `navbar1` includes dropdown navigation and a mobile `Sheet`.
- `input-input-types-4` is a search input example using shadcn `Input`.
- `command-command-standard-1` is a static command list with `CommandInput`,
  `CommandList`, `CommandEmpty`, `CommandGroup`, and `CommandItem`.
- `combobox-combobox-standard-1` is a single-select `Popover` plus `Command`
  example, not a free-text site search or autocomplete.
- `sheet-sheet-navigation-1` and `drawer-drawer-left-2` are generic mobile/left
  navigation examples without the current drawer content model.
- `empty-empty-search-1` and `empty-empty-actions-1` use the shadcn `Empty`
  component family and optional `Button` actions.
- `tabs-tabs-standard-1` is a basic tabbed content example with placeholder card
  panels.
- `button-link` wraps shadcn `buttonVariants` for anchor rendering; the repo
  already has the underlying shadcn `Button` and `buttonVariants` exported.

Correction-pass registry inspection was run from `packages/design-system` with
the verified local env file sourced and without printing the token:

```bash
set -a; source /Users/devin/dev/repos/shadcnblocks/.env; set +a
pnpm dlx shadcn@latest search @shadcnblocks --query product-card --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query product-list --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query navbar --limit 30 --json
pnpm dlx shadcn@latest search @shadcnblocks --query sidebar --limit 30 --json
pnpm dlx shadcn@latest search @shadcnblocks --query directory --limit 30 --json
pnpm dlx shadcn@latest search @shadcnblocks --query application-shell --limit 30 --json
pnpm dlx shadcn@latest search @shadcnblocks --query empty --limit 30 --json
pnpm dlx shadcn@latest search @shadcnblocks --query command --limit 30 --json
pnpm dlx shadcn@latest search @shadcnblocks --query hero --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query cta --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query feature --limit 20 --json
pnpm dlx shadcn@latest search @shadcnblocks --query newsletter --limit 20 --json
pnpm dlx shadcn@latest view @shadcnblocks/projects8 @shadcnblocks/feature77 @shadcnblocks/product-card21
pnpm dlx shadcn@latest view @shadcnblocks/product-list5 @shadcnblocks/product-list3 @shadcnblocks/gallery31
pnpm dlx shadcn@latest view @shadcnblocks/application-shell4 @shadcnblocks/application-shell13 @shadcnblocks/navbar18 @shadcnblocks/sidebar5
pnpm dlx shadcn@latest view @shadcnblocks/empty-empty-search-5 @shadcnblocks/empty-empty-actions-1 @shadcnblocks/command-command-popover-5 @shadcnblocks/command-command-standard-5
pnpm dlx shadcn@latest view @shadcnblocks/hero7 @shadcnblocks/hero50 @shadcnblocks/cta34
pnpm dlx shadcn@latest view @shadcnblocks/feature3 @shadcnblocks/feature68 @shadcnblocks/feature75
pnpm dlx shadcn@latest view @shadcnblocks/cta23 @shadcnblocks/cta7
```

The authenticated ShadcnBlocks registry configuration for this workspace lives in
`packages/design-system/components.json`, so registry inspection for this pass
was run from `packages/design-system`. To avoid overwriting existing repo-owned
shadcn primitives, the adopted source was added under the non-conflicting
namespace `packages/design-system/components/shadcnblocks`.

Additional observed source facts from the correction pass:

- `product-list3` and `product-list5` provide ShadcnBlocks product-list/card
  composition using shadcn `Card`, `CardContent`, `CardTitle`, `Badge`, and
  responsive grid structure.
- `empty-empty-search-5` and `empty-empty-actions-1` provide the shadcn `Empty`
  composition for search/filter empty states and single-action empty states.
- `command-command-standard-5` and `command-command-popover-5` provide the
  shadcn `Command`, `CommandList`, `CommandGroup`, `CommandItem`, and
  description-row structure used by the autocomplete surface.
- `sidebar5` provides grouped sidebar navigation with search, labels, active
  menu buttons, scroll area, and sidebar provider ownership; the grouped
  navigation row/source pattern was adopted without taking over the route shell.
- `application-shell4` and `application-shell13` provide top-nav/search/mobile
  sheet patterns; the top-nav shell/search row pattern was adopted without taking
  over route layout or the existing mobile drawer.
- `navbar18` provides compact logo, desktop navigation, action, and mobile menu
  patterns; only the header grouping/action layout was adopted because current
  mobile drawer and auth/search behavior remain site-owned.
- `hero7` and `hero50` provide centered hero copy/CTA composition; the centered
  hero container pattern was adopted while preserving current copy, count pill,
  animation, and background.
- `feature3` and `feature68` provide reusable section/card grid structure; the
  grid wrapper pattern was adopted without changing section item data.
- `cta7`, `cta23`, and `cta34` provide CTA/newsletter band structure; the CTA
  band wrapper was adopted while keeping the current submit-link workflow.
- `projects8`, `feature77`, and `gallery31` were inspected as
  directory-adjacent alternatives. They were not adopted for listing cards
  because they are image/portfolio/gallery-first and would change directory
  card density and data requirements.

Adopted source attribution:

| Design-system file | Registry source inspected | Adopted source shape |
| --- | --- | --- |
| `packages/design-system/components/shadcnblocks/directory-empty.tsx` | `empty-empty-search-5`, `empty-empty-actions-1` | ShadcnBlocks `Empty`/`EmptyHeader`/`EmptyContent` composition with configurable icon, copy, and primary/secondary actions. |
| `packages/design-system/components/shadcnblocks/directory-command.tsx` | `command-command-standard-5`, `command-command-popover-5` | ShadcnBlocks command list/group/item structure adapted to the existing autocomplete item model and controlled keyboard index. |
| `packages/design-system/components/shadcnblocks/directory-product-list.tsx` | `product-list3`, `product-list5` | ShadcnBlocks product list/card composition using shadcn `Card`, `CardContent`, `CardTitle`, `Badge`, and responsive grid wrappers. |
| `packages/design-system/components/shadcnblocks/directory-navigation.tsx` | `sidebar5` | ShadcnBlocks grouped sidebar navigation rows adapted as reusable section/item primitives without taking over shell ownership. |
| `packages/design-system/components/shadcnblocks/directory-application-shell.tsx` | `application-shell4`, `application-shell13`, `navbar18` | ShadcnBlocks top navigation/header grouping, action cluster, desktop nav, and search-surface wrappers adapted around the existing public header behavior. |
| `packages/design-system/components/shadcnblocks/directory-home-section.tsx` | `hero7`, `hero50`, `feature3`, `feature68`, `cta7`, `cta23`, `cta34` | ShadcnBlocks centered hero, section header, feature grid, and CTA band structures adapted around existing copy, routes, and slots. |

## Mapping Table

| Surface | Current files | Current visual role and imports | Registry/source inspected | Decision | Behavioral and visual contracts to preserve | Refactor slice owner |
| --- | --- | --- | --- | --- | --- | --- |
| Header, nav, desktop search, mobile search | `packages/web-core/src/layout/header.tsx`, `packages/web-core/src/layout/header-search.tsx`, `packages/web-core/src/search/search-autocomplete.tsx` | Sticky `h-16` header, centered desktop search, mobile search overlay, auth/account/submit actions, command autocomplete. Uses ShadcnBlocks-derived application shell wrappers plus existing behavior owners. | `application-shell4`, `application-shell13`, `navbar18`, `input-input-types-4`, `command-command-standard-5`, `command-command-popover-5`, `combobox-combobox-standard-1`, `button-link`, existing shadcn `Button`. | Adopted `application-shell4`/`application-shell13`/`navbar18` header grouping, action cluster, nav, and search-surface composition through `DirectoryApplication*` exports. Adopted command examples through `DirectoryCommand`. Rejected full app-shell/navbar ownership because it would replace current route-driven nav, auth gates, drawer, and mobile search behavior. Rejected combobox as a direct search replacement because it is a single-select popover. | Sticky top header, `h-16`, backdrop/border, desktop search breakpoint, mobile overlay below header, body scroll lock, Escape handling, autocomplete keyboard navigation, recent-search state, search submit routes, auth feature gates, submit/account/login links, analytics calls. | Canonical Phase 1C slice 3 for search input/autocomplete primitives; slice 6 for header shell. |
| Mobile drawer | `packages/web-core/src/layout/mobile-drawer.tsx` | Left drawer with overlay, body scroll lock, route-change close, navigation/category/favorites/resources links. Uses shared ShadcnBlocks-derived navigation sections/items plus existing drawer behavior. | `sheet-sheet-navigation-1`, `drawer-drawer-left-2`, `navbar1`, `sidebar5`, `application-shell4`, shadcn `scroll-area`. | Adopted `sidebar5` grouped navigation row/section pattern through `DirectoryNavigationSection` and `DirectoryNavigationItem`. Still rejected full `navbar1`/sheet/drawer replacement because current drawer owns custom focus trap, body-scroll restore, route-close behavior, and featured scroll behavior. | Mobile-only behavior, overlay opacity/backdrop, body scroll restore, close on route change, account/login/auth conditions, submit/docs/guides/news links, favorites link, category active state, featured count, external resource `target="_blank"` and `rel="noopener noreferrer"`. | Canonical Phase 1C slice 5. |
| Desktop sidebar and category navigation | `packages/web-core/src/layout/app-sidebar.tsx` | Sticky desktop sidebar hidden on mobile; category, featured, favorites, resources groups. Uses shared ShadcnBlocks-derived navigation sections/items and shadcn `ScrollArea`. | `sidebar1`, `sidebar5`, `application-shell1`, shadcn `scroll-area`, `separator`, `badge`, `button`. | Adopted `sidebar5` grouped sidebar navigation structure through the design-system `DirectoryNavigation*` exports. Rejected full `SidebarProvider`/`SidebarInset` ownership because it would change the public directory shell. | `240px` min/max width, `sticky top-16`, `h-[calc(100vh-4rem)]`, hidden below `sm`, category filtering links, featured count pill, favorites section, resources section, active category state, external link semantics. | Slice 5. |
| Listing cards and public grid | `packages/web-core/src/llm/llm-grid.tsx`, `packages/web-core/src/llm/listing-card.tsx`, `packages/web-core/src/ui/favorite-button.tsx`, section route wrappers using `LLMGrid` | Directory listing cards with favicon/fallback, favorite button, unofficial badge, link overlay, compact/default variants, wide-screen collapse. Uses ShadcnBlocks-derived product-list/card exports from design-system. | `product-list3`, `product-list5`, `product-card21`, `projects8`, `feature77`, `gallery31`, shadcn `card`, `badge`, `button`. | Adopted `product-list3`/`product-list5` card/list composition through `DirectoryProductList`, `DirectoryProductCard`, `DirectoryProductRow`, and `DirectoryProductBadge`. Rejected ecommerce price/cart/media details and gallery/project blocks because they would change data shape and card density. | Grid breakpoints `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 4xl:grid-cols-8`, compact variant, max-item collapse and `4xl:block`, favorite button affordance, favicon fallback, unofficial badge styling, link overlay, `data-analytics`, `data-website-name`, `data-website-slug`, `data-source`, line clamps, animation classes. | Slice 4. |
| Search and filter controls | `packages/web-core/src/websites-search-controls.tsx`, `packages/web-core/src/websites-list-with-search.tsx`, `packages/web-core/src/search/search-autocomplete.tsx`, `packages/web-core/src/search/search-results.tsx`, `packages/web-core/src/search/search-filters.tsx` | Homepage search field, autocomplete, favorites-only toggle, result counts, sort `ToggleGroup`, local filtering and persisted sort. Uses design-system `ToggleGroup`; autocomplete now uses ShadcnBlocks-derived command list. | `input-input-types-4`, `toggle-group-toggle-group-standard-3`, `command-command-standard-5`, `command-command-popover-5`, `combobox-combobox-standard-1`, `tabs-tabs-standard-1`. | Adopted `command-command-standard-5`/`command-command-popover-5` structure through `DirectoryCommand` for autocomplete rows. Kept existing `ToggleGroup` ownership. Rejected combobox/tabs as direct filter replacements because they would change free-text search and persisted filter semantics. | `localStorage` key `websites-sort-by`, homepage search submit to search route, favorites-only behavior, counts and labels, sort analytics, keyboard focus rings, autocomplete keyboard navigation, recent search behavior, live result count text, empty/no-results handoff. | Canonical Phase 1C slice 2 for small controls; slice 3 for search controls. |
| Empty states | `packages/web-core/src/empty-state.tsx`, empty branches in `packages/web-core/src/websites-list-with-search.tsx`, search empty routes | Centered unframed empty state with icon, title, description, optional action callback or link. Uses ShadcnBlocks-derived `DirectoryEmpty` from design-system. | `empty-empty-search-5`, `empty-empty-actions-1`, shadcn `empty`, shadcn `button`. | Adopted `empty-empty-search-5` and `empty-empty-actions-1` structure through `DirectoryEmpty`, preserving the existing unframed public presentation and action href/callback semantics. | Centered vertical rhythm, `h-[50vh]`, icon size and muted color, title/description text/copy, `onAction` callback behavior, `actionHref` link behavior, no card frame unless visually identical. | Canonical Phase 1C slice 2. |
| Homepage and public sections | `packages/web-core/src/home-page.tsx`, `packages/web-core/src/sections/*`, `packages/web-core/src/layout/section.tsx`, `packages/web-core/src/website-routes/detail-page.tsx`, `packages/web-core/src/website/*` | Composes hero, featured/recent sections, external resources, guides, listing detail, and related projects through route wrappers and slots. Uses ShadcnBlocks-derived hero, section, feature-grid, CTA, product-card/list, and existing shadcn primitive exports. | `hero7`, `hero50`, `feature3`, `feature68`, `feature75`, `cta7`, `cta23`, `cta34`, `product-list3`, `product-list5`, `tabs-tabs-standard-1`, shadcn `card`, `badge`, `button`. | Adopted centered hero, sticky section header, feature grid, CTA band, and product list/card structure through design-system `Directory*` exports. Rejected full page/marketing-section replacement because current sections are route-slot-driven and site-copy aware; rejected tabs as a direct section replacement because current homepage sections are not tabbed. | Section titles, descriptions, anchors, route wrapper slot contracts, site-copy behavior, listing ordering, metadata/schema/data loading, detail page `lg:grid-cols-12`, resource external links, submit links. | Canonical Phase 1C slice 7. |

## Canonical Phase 1C Slice Order

This mirrors `PLAN_REFACTOR.md` and keeps the slice numbers used in the mapping
table stable.

1. Shared primitive/import cleanup needed by Phase 1 only.
2. Empty state and small controls.
3. Search controls and command/input primitives.
4. Listing card/grid.
5. Sidebar and mobile drawer.
6. Header/application shell.
7. Homepage/section composition after the lower-level pieces are stable.
8. Listing detail/category/search page parity checks and minor alignment fixes.

## Explicit Rejections

- `application-shell1`: rejected as a full replacement because it introduces
  `SidebarProvider`, `SidebarInset`, sidebar rails, breadcrumbs, and app-dashboard
  content ownership that conflicts with the current public directory shell.
- `navbar1`: rejected as a full replacement because it adds dropdown menu and sheet
  navigation behavior that does not match current route generation, auth gates, and
  mobile drawer/search split.
- `sidebar1`: rejected as a full replacement because it changes sidebar ownership
  and layout behavior; only small primitive patterns may be adapted.
- `product-card1` and `product-list1`: rejected as full replacements because their
  source is ecommerce image/price/sale-card oriented, not directory listing cards.
- `command-command-standard-1` and `combobox-combobox-standard-1`: rejected as
  direct search replacements; they may inform internals only if current
  autocomplete and filter semantics remain exact.
- `sheet-sheet-navigation-1` and `drawer-drawer-left-2`: rejected as direct mobile
  drawer replacements; shadcn `Sheet`/`Drawer` primitives may be evaluated in the
  drawer slice only with explicit parity proof.
- `tabs-tabs-standard-1`: rejected as a direct homepage/section replacement because
  current homepage sections are not tabbed.

## Validation Required Per Slice

Every implementation slice must run the checks named in `PLAN_REFACTOR.md` for
its scope:

```bash
git status --short
pnpm --filter @thedaviddias/design-system typecheck
pnpm typecheck
pnpm validate:site -- --site serpdownloaders.com
pnpm build:site -- --site serpdownloaders.com
pnpm test:repo
pnpm test:e2e
```

Visual and functional parity checks must be run for any changed public surface.
