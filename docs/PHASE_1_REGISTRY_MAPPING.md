# Phase 1 Registry Mapping

Status: source-of-truth mapping for Phase 1B before public UI refactor work.

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
- No ShadcnBlocks-owned block source is installed under
  `packages/design-system` at mapping time.
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

## Mapping Table

| Surface | Current files | Current visual role and imports | Registry/source inspected | Decision | Behavioral and visual contracts to preserve | Refactor slice owner |
| --- | --- | --- | --- | --- | --- | --- |
| Header, nav, desktop search, mobile search | `packages/web-core/src/layout/header.tsx`, `packages/web-core/src/layout/header-search.tsx`, `packages/web-core/src/search/search-autocomplete.tsx` | Sticky `h-16` header, centered desktop search, mobile search overlay, auth/account/submit actions, custom autocomplete. Uses local markup plus `cn` in autocomplete. | `application-shell1`, `navbar1`, `input-input-types-4`, `command-command-standard-1`, `combobox-combobox-standard-1`, `sheet-sheet-navigation-1`, `button-link`, existing shadcn `Button`. | Reject full `application-shell1` and `navbar1`; they bring app-shell/sidebar/mobile-sheet assumptions that would change layout and navigation. Adapt `input-input-types-4` only as a search-input primitive pattern. Consider `command-command-standard-1` only as an internal autocomplete list pattern if keyboard behavior, recent/category/website suggestions, and analytics can remain exact. Reject `combobox-combobox-standard-1` as a direct replacement because it is a single-select popover. Adopt existing shadcn `Button`/`buttonVariants` for header icon/action controls where visual parity holds; defer `button-link` unless anchor-button duplication becomes meaningful. | Sticky top header, `h-16`, backdrop/border, desktop search breakpoint, mobile overlay below header, body scroll lock, Escape handling, autocomplete keyboard navigation, recent-search state, search submit routes, auth feature gates, submit/account/login links, analytics calls. | Canonical Phase 1C slice 3 for search input/autocomplete primitives; slice 6 for header shell. |
| Mobile drawer | `packages/web-core/src/layout/mobile-drawer.tsx` | Custom left drawer with overlay, body scroll lock, route-change close, navigation/category/favorites/resources links. Uses `cn` and local markup. | `sheet-sheet-navigation-1`, `drawer-drawer-left-2`, `navbar1` mobile sheet source, shadcn `sheet` and `drawer` primitives already exported. | Reject full `navbar1` mobile menu and generic drawer examples because they do not include the current content model, route-close behavior, favorites/resources sections, or exact overlay behavior. Adapt shadcn `Sheet` only if an implementation can prove identical left-side dimensions, scroll locking, close semantics, and link set. Reject `drawer-drawer-left-2` as a direct replacement because it replaces route links with generic button actions and uses Vaul drawer behavior. | Mobile-only behavior, overlay opacity/backdrop, body scroll restore, close on route change, account/login/auth conditions, submit/docs/guides/news links, favorites link, category active state, featured count, external resource `target="_blank"` and `rel="noopener noreferrer"`. | Canonical Phase 1C slice 5. |
| Desktop sidebar and category navigation | `packages/web-core/src/layout/app-sidebar.tsx` | Sticky desktop sidebar hidden on mobile; category, featured, favorites, resources groups. Local markup with `FavoritesLink`. | `sidebar1`, `application-shell1`, shadcn `scroll-area`, `separator`, `badge`, `button`. | Reject full `sidebar1`/`application-shell1`; they introduce `SidebarProvider`, `SidebarInset`, rails, breadcrumbs, collapsible app navigation, and different layout ownership. Adapt only small primitives such as `ScrollArea`, `Separator`, `Badge`, and button-like link styling if visual parity holds. | `240px` min/max width, `sticky top-16`, `h-[calc(100vh-4rem)]`, hidden below `sm`, category filtering links, featured count pill, favorites section, resources section, active category state, external link semantics. | Slice 5. |
| Listing cards and public grid | `packages/web-core/src/llm/llm-grid.tsx`, `packages/web-core/src/ui/card.tsx`, `packages/web-core/src/ui/favorite-button.tsx`, section route wrappers using `LLMGrid` | Directory listing cards with favicon/fallback, favorite button, unofficial badge, link overlay, compact/default variants, wide-screen collapse. Uses design-system `Badge`, local `Card` wrapper over design-system `card`, and `cn`. | `product-card1`, `product-list1`, product search results including `product-card2`, `product-list2`, shadcn `card`, `badge`, `button`. | Reject full product blocks; inspected source is ecommerce/image/price/cart oriented and would introduce aspect-ratio media, price helpers, sale badges, and grid spacing that do not match directory cards. Adapt card/list composition patterns only; keep existing data shape and local listing card composition unless a dedicated design-system directory card is extracted from current markup. | Grid breakpoints `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 4xl:grid-cols-8`, compact variant, max-item collapse and `4xl:block`, favorite button affordance, favicon fallback, unofficial badge styling, link overlay, `data-analytics`, `data-website`, `data-category`, `data-source`, line clamps, animation classes. | Slice 4. |
| Search and filter controls | `packages/web-core/src/websites-search-controls.tsx`, `packages/web-core/src/websites-list-with-search.tsx`, `packages/web-core/src/search/search-results.tsx`, `packages/web-core/src/search/search-filters.tsx` | Homepage search field, favorites-only toggle, result counts, sort `ToggleGroup`, local filtering and persisted sort. Uses design-system `ToggleGroup`; search input is local markup. | `input-input-types-4`, `toggle-group-toggle-group-standard-3`, `command-command-standard-1`, `combobox-combobox-standard-1`, `tabs-tabs-standard-1`. | Adopt existing shadcn `ToggleGroup` ownership; current code already matches the single-selection pattern. Adapt `input-input-types-4` for search-input alignment. Reject `combobox-combobox-standard-1` and `tabs-tabs-standard-1` as direct replacements for current filters unless a later slice proves no change to filtering semantics or focus order. | `localStorage` key `websites-sort-by`, homepage search submit to search route, favorites-only behavior, counts and labels, sort analytics, keyboard focus rings, live result count text, empty/no-results handoff. | Canonical Phase 1C slice 2 for small controls; slice 3 for search controls. |
| Empty states | `packages/web-core/src/empty-state.tsx`, empty branches in `packages/web-core/src/websites-list-with-search.tsx`, search empty routes | Centered unframed empty state with icon, title, description, optional action callback or link. Uses design-system `Button` and `cn`. | `empty-empty-search-1`, `empty-empty-actions-1`, shadcn `button`, shadcn `card`. | Adapt `empty-empty-search-1` and `empty-empty-actions-1` as structure references only. Do not adopt the default shadcn Empty source unless it preserves current `h-[50vh]`, icon sizing, action semantics, and unframed presentation. Keep `Button` export use. | Centered vertical rhythm, `h-[50vh]`, icon size and muted color, title/description text/copy, `onAction` callback behavior, `actionHref` link behavior, no card frame unless visually identical. | Canonical Phase 1C slice 2. |
| Homepage and public sections | `packages/web-core/src/home-page.tsx`, `packages/web-core/src/sections/*`, `packages/web-core/src/website-routes/detail-page.tsx`, `packages/web-core/src/website/*` | Composes hero, featured/recent sections, external resources, guides, listing detail, and related projects through route wrappers and slots. Uses design-system `Card`, `Badge`, `Button`, and local section/card wrappers. | `product-list1`, `product-card1`, `tabs-tabs-standard-1`, shadcn `card`, `badge`, `button`. | Reject full product/list and tabs blocks for homepage composition because current sections are slot-driven and site-copy aware. Adapt shadcn card/badge/button primitives where already present; consider extraction of repeated section-card patterns only after lower-level slices stabilize. | Section titles, descriptions, anchors, route wrapper slot contracts, site-copy behavior, listing ordering, metadata/schema/data loading, detail page `lg:grid-cols-12`, resource external links, submit links. | Canonical Phase 1C slice 7 after lower-level pieces. |

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
